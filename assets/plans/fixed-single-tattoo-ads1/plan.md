# Ads_1 Fixed Single-Tattoo Flow

## Summary

Change `Ads_1.scene` from a two-slider tattoo-selection flow to a one-button, one-tattoo drawing flow. The player sees one start button, taps it, and then draws exactly one fixed tattoo prefab. There is no front/back concept and no selection state in the resulting gameplay.

## Selected Direction

Use the existing `TatooContext1` as the owner of the scene flow and drawing lifecycle. Add an explicit serialized fixed tattoo prefab reference, replace slider-derived selection with one prefab load, deactivate the wheel UI in `Ads_1`, and preserve the current sticker patch, foam, confetti, completion, and play-more systems.

The planned default fixed asset is:

`assets/TattooAssets/prefab/ingame/Stickers/line/TattooLineSticker_130.prefab`

The asset remains configurable through the scene property so the design can be changed without restoring selection logic.

## Existing Architecture

- Project version: Cocos Creator `3.8.7`.
- Scene: `assets/Scene/Ads_1.scene`.
- Active context component in the scene: `TatooContext1`, serialized as a scene component.
- Base lifecycle in `TattoContext`:
  - `start()` initializes audio/input and calls `onIntro()`.
  - `onIntro()` calls `onPlay()`.
  - `loadAllStickerPlay()` instantiates indexed prefabs and creates the iterator.
  - `playNextSticker()` advances patches or shows completion.
- Current `TatooContext1` behavior:
  - `start()` wires two `SlideSticker` callbacks and initializes two preview sprites.
  - `onClickDoIt()` hides the selector and starts the drawing presentation.
  - `onPlay()` derives front/back prefab indices from preview sprite names and loads two stickers.
  - `onCurrentStickerClearFoamDone()` advances to the next sticker.
- `Ads_1.scene` currently serializes two tattoo slider references through the `SelectTattoo` instance and routes the selection button click to `onClickDoIt`.

## Target Architecture

The flow becomes:

```text
Ads_1 scene loaded
    -> selector wheel nodes inactive
    -> start button visible
    -> button accepts one tap
    -> context hides start UI and enables drawing presentation
    -> context loads one fixed prefab
    -> one sticker patch/foam sequence
    -> completion confetti and play-more CTA
```

Gameplay truth is the context phase and sticker iterator. Preview images, wheel nodes, opacity transitions, and button animation are presentation only and must not determine which prefab is instantiated.

## Scope

### In Scope

- Add a fixed tattoo prefab property to `TatooContext1`.
- Replace two-index selection and two-sticker loading with one fixed prefab load.
- Remove front/back preview and slider reads from the active `Ads_1` path.
- Deactivate wheel/slider UI and selector touch interception in `Ads_1.scene`.
- Preserve existing drawing, foam, completion, confetti, and play-more behavior.
- Add exactly-once start guarding and missing-prefab handling.
- Validate Cocos serialization, mobile touch, resize, and WebGL preview behavior.

### Out of Scope

- Changing tattoo patch drawing mechanics, foam behavior, camera post-processing, machine animation, or completion CTA destination.
- Refactoring `TattoContext` or `TatooContext3` for unrelated scenes.
- Deleting reusable slider/select prefabs or all unused tattoo assets from the project.
- Adding a new UI design system, new art, new sound, or new analytics event taxonomy.
- Changing scenes other than `Ads_1.scene`.

## Constraints

- Cocos Creator `3.8.7`, TypeScript, mobile/WebGL playable-ad runtime.
- One tattoo prefab instance per playthrough.
- No front/back distinction.
- Existing unrelated worktree changes must be preserved.
- No commit is authorized by the user.
- Exact replacement button artwork/text is not specified; retain the existing button style and update label only if needed during implementation.

## File-Level Change Map

| File | Current responsibility | Required change | Dependencies / impact |
|---|---|---|---|
| `assets/scripts/src/context/TattooContext1.ts` | Owns `Ads_1` selector transition, preview state, and two-sticker selection/loading | Add serialized `fixedTattooPrefab`; add one-shot start/phase guard; make the start handler hide selector presentation and initialize drawing; make `onPlay()` load exactly one fixed prefab; remove slider-index and front/back name derivation from the active path; ensure one-sticker completion does not advance to a second item | Depends on existing `TattoContext`, `TattooSticker`/`TattooLineSticker`, iterator, and foam callbacks; runtime allocations remain one prefab instance plus existing patch objects |
| `assets/Scene/Ads_1.scene` | Serializes the scene instance, context property assignments, selector hierarchy, and button click event | Assign the fixed prefab UUID, deactivate slider/wheel nodes and selector blocking nodes, keep the start button event targeting the context, and remove/clear obsolete front/back component references if the edited component no longer exposes them | Cocos scene serialization must be saved/validated in Creator 3.8.7; only this scene instance changes |

The reusable `SelectTattoo.prefab` and `TattooSlider.prefab` are intentionally not modified in this plan so other scenes can continue using them.

## APIs and Ownership

### New or Changed Context State

- `fixedTattooPrefab: Prefab`
  - Owner: `TatooContext1`.
  - Reader: the one-sticker `onPlay()` path.
  - Writer: Cocos scene serialization only.
  - Lifecycle: available before the start button is accepted.
- `hasStartedDrawing: boolean`
  - Owner: `TatooContext1`.
  - Reader/writer: start-button handler and any defensive start checks.
  - Lifecycle: false on load, true after the first accepted start, never reset during the playthrough.
- `drawingPhase` (implementation may use an existing boolean or a small enum)
  - Owner: `TatooContext1`.
  - States: `selection`, `drawing`, `completed`.
  - Lifecycle: selection on load, drawing after the accepted start, completed after the one sticker finishes.

### API Contract

- Start handler (retain `onClickDoIt()` or rename to `onClickStart()`):
  - Parameters: none.
  - Return: void.
  - Caller: the `Ads_1` start button click event.
  - Behavior: no-op when already started; validate fixed prefab; hide/deactivate selector and start presentation; then trigger one-sticker setup exactly once.
- `onPlay()`:
  - Parameters: none.
  - Return: void.
  - Caller: existing `onIntro()` after the accepted start, or the explicit start handler if lifecycle is moved there.
  - Behavior: instantiate/load only `fixedTattooPrefab`; never inspect slider indices or preview sprite names.
- `loadTattooSticker(...)`:
  - Keep the existing base-compatible loading behavior, but call it once with the fixed prefab or adapt the single-sticker path so it does not depend on a prefab array index.

## State and Data Flow

| State | Entry | Update | Exit | Allowed transitions |
|---|---|---|---|---|
| `selection` | Scene/context load | Wait for the start button; wheel nodes are inactive | Accepted start tap | `drawing` |
| `drawing` | Fixed prefab validated and initialized | Existing patch touch input, foam fill/clear, machine/camera presentation | One sticker clear/complete callback | `completed` |
| `completed` | One sticker is finished | Confetti and play-more CTA remain active | CTA tap | Existing game-end behavior |

The start button is the only input that can transition from `selection` to `drawing`. The sticker iterator contains one item. `onCurrentStickerClearFoamDone()` must finish the playthrough rather than assume a second sticker exists.

## Subtasks

### Context Code

- [done] Add `fixedTattooPrefab` and a one-shot drawing-phase guard to `TatooContext1`.
- [done] Replace preview-name/slider-index resolution with one fixed-prefab setup.
- [done] Remove active-path front/back preview updates, slider callback wiring, and two-sticker progression.
- [done] Preserve inherited patch, foam, confetti, and CTA callbacks.
- [done] Add defensive handling for a missing fixed prefab and repeated start taps.

### Ads_1 Scene Serialization

- [done] Assign `TattooLineSticker_130.prefab` to the new fixed-prefab property.
- [done] Deactivate the two slider/wheel nodes at runtime from the scene-owned context so they cannot intercept touch.
- [done] Keep the existing start button click event bound to the new/retained start handler.
- [done] Remove obsolete serialized references only after the component shape is finalized in Creator.

### Validation

- [in-progress] Type-check/compile the project with the existing Cocos workflow; no local TypeScript compiler or Cocos CLI is available in this workspace.
- [todo] Preview `Ads_1.scene` and verify the initial UI has only the start CTA active.
- [todo] Verify one tap creates exactly one tattoo sticker and starts the tutorial/drawing phase.
- [todo] Verify drawing completion, foam transitions, confetti, and play-more CTA.
- [todo] Verify repeated taps, rapid taps, multi-touch, and missing-prefab behavior.
- [todo] Verify portrait resize/WebGL touch targeting and no selector input interception.

## Dependencies and Sequence

1. Update the component property/state design in `TattooContext1.ts`.
2. Update the one-sticker start and completion logic in the same component.
3. Open/save `Ads_1.scene` in Cocos Creator 3.8.7 to serialize the fixed prefab and inactive selector nodes.
4. Compile/type-check before runtime testing.
5. Run the scene through the full playable flow and inspect runtime hierarchy/counts.
6. Review the final diff for accidental changes to unrelated dirty files.

## Performance and Build Impact

- No new textures, shaders, materials, plugins, or dependencies.
- Runtime instantiation decreases from two tattoo prefabs to one.
- Selector slider update/touch work is removed from the active scene.
- Per-frame patch drawing cost is unchanged for the selected tattoo.
- One additional serialized prefab reference is negligible; keeping the existing prefab array may retain bundle dependencies, so implementation should only remove array entries if Cocos dependency analysis confirms they are scene-local and safe to remove.
- No new allocations should occur on repeated taps; the start guard must prevent duplicate instantiation.

## Compatibility and Serialization

- Use Cocos Creator 3.8.7-compatible decorators and serialized `Prefab` property types already used by the codebase.
- Preserve the existing `@ccclass('TatooContext1')` identity so the scene component remains resolvable.
- Save scene changes through Creator or an equivalent valid serialized edit; do not hand-edit UUIDs without validation.
- Keep scene references to existing camera, opacity, foam, tutorial, and CTA nodes intact.

## Edge Cases and Risks

- Start button tapped more than once before tweens complete: ignored after the first accepted tap.
- Fixed prefab unset: log an actionable error and keep drawing inactive; do not call `instantiate(undefined)`.
- Hidden slider still blocks the start button: deactivate the actual node/overlay, not only its opacity.
- Stale inherited arrays/iterator: clear `tattooStickers`, reset iterator/index state, and load one item only.
- Completion callback assumes another item: explicitly route the one-item iterator exhaustion to completion.
- Cocos scene property migration leaves stale references: inspect the serialized component block and preview runtime hierarchy.
- Existing unrelated modified files: do not include or rewrite them.

## Validation Steps

1. Confirm `package.json` reports Cocos Creator `3.8.7`.
2. Compile/type-check using the project’s normal Cocos command or Creator editor diagnostics.
3. Open `Ads_1.scene`; confirm the selector wheel is inactive and the start button is visible.
4. Tap start once; verify the selector disappears, drawing presentation enables, and one tattoo prefab is instantiated.
5. Complete the tattoo; verify foam fill/clear, confetti, and `playMoreButton` behavior.
6. Inspect the runtime node tree or debug counters; assert exactly one sticker component exists.
7. Tap start repeatedly and use rapid/multi-touch; assert no duplicate iterator or sticker instance.
8. Resize/preview in portrait WebGL/mobile dimensions; verify button hit area and drawing camera remain aligned.
9. Search the final active path for `slideStickerFront`, `slideStickerBack`, `stickerPreviewFront`, `stickerPreviewBack`, and two-item loading; confirm none are required for `Ads_1`.

## Acceptance Criteria

- `Ads_1.scene` starts with one visible start button and no active tattoo wheel/slider interaction.
- One accepted button press transitions to drawing exactly once.
- Exactly one fixed tattoo prefab is instantiated per playthrough.
- There is no front/back state, slider-derived selection, or second sticker progression.
- Existing drawing input, foam behavior, completion feedback, and play-more CTA still work.
- Repeated or multi-touch start attempts do not duplicate the tattoo or reset the flow.
- Missing scene configuration fails safely and is diagnosable.
- The project compiles and the scene runs in Cocos Creator 3.8.7/WebGL preview without unrelated regressions.

## Immediate Next Action

Run the Cocos implementation workflow against this plan: update `TatooContext1.ts`, serialize the corresponding `Ads_1.scene` property and node changes in Creator 3.8.7, then execute the validation checklist. Do not commit until the user explicitly authorizes it.
