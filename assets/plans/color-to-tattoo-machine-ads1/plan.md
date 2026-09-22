# Ads_1 Color-to-Tattoo-Machine Phase

## Summary and selected direction

Update the fixed single-tattoo flow so the final line completion presents `finalImage` immediately, raises it above the line children, then plays the existing Text Wow Spine animation. Color entry starts only after the Spine animation completes. When the Color node reaches `final`, Ads_1 enters a dedicated tattoo-machine phase: the first configured `PatchSticker` is shown, its dots opacity flashes between serialized minimum and maximum values, and any player touch/click redirects to the store exactly once. `finalImage` remains visible throughout Color entry and tattoo-machine phase.

## Repository Context / Implementation Surface

- Target: `D:/New folder/Projects/PLA_Tatoo`.
- Runtime: Cocos Creator `3.8.7`, TypeScript, mobile/WebGL playable ad.
- Active scene: `assets/Scene/Ads_1.scene`; scene flow is owned by `assets/scripts/src/context/TattooContext1.ts`.
- Existing final image support: `assets/scripts/src/TattooLineSticker.ts` has serialized `finalImage`; `showFinalImageOnly()` activates it and hides other direct children when the last patch completes.
- Existing line completion: `TattooLineSticker.onPrayComplete()` hides the last patch, calls `showFinalImageOnly()`, then calls `window.tattoContext.onCurrentStickerDone()`.
- Existing Color entry: `TatooContext1.onCurrentStickerDone()` reparents `colorNode` from `colorBeginNode` to `colorTargetNode` preserving world position, then tweens local position to zero. Completion currently logs and starts `ColorSelectionController`.
- Existing Text Wow: `TattoContext.showTextWow()` selects a skin, clears track 0, and calls `textWowSpine.setAnimation(0, 'animation', false)`. No completion callback is currently wired in project code; the exact Cocos Spine completion API must be verified from installed typings/runtime before implementation.
- Existing patch model: `PatchSticker` owns `dotsNode`, `dotsNodeOpacity`, `patchNode`, `sprayComp`, and initializes dots opacity to zero. `PatchSticker2` extends it and currently shows/hides dots during its patch phase. `TattooLineSticker` collects direct child `PatchLineSticker`/`PatchSticker2` components and skips null children.
- Existing store action: `gameEndHandler.StoreGameChangingNoCondition()` is already used by `TattoContext.onClickPlayMore()` and drawing input code.
- Existing root input: `TattoContext`/`TatooContext1` register touch listeners for tutorial/input; a dedicated machine-phase guard must avoid duplicate store calls and must not activate before Color entry completes.
- User will configure the sticker prefab to contain one relevant `PatchSticker`; implementation should display the first collected patch (`patchs[0]`) and not require a new selection array.

## Target architecture and flow

```text
Final line complete
    -> finalImage.active = true; finalImage.setSiblingIndex(last)
    -> Text Wow Spine plays once
    -> Spine completion callback
       -> Color entry starts
       -> Color reaches final
          -> machine phase starts
             -> first PatchSticker visible
             -> dots opacity flashes min <-> max
             -> any touch/click -> Store exactly once
```

`finalImage` is presentation state and remains visible. Tattoo-machine phase is owned by `TatooContext1`; patch flash is presentation state owned by `PatchSticker` (or a narrowly scoped helper method on it). Store redirect is the only gameplay/CTA action and is guarded for exactly-once execution.

## Scope and constraints

### In scope

- Preserve the existing final-image node/reference and ensure it is raised before Text Wow starts.
- Add a completion-aware Text Wow transition so Color entry waits for the non-looping Spine animation to finish.
- Add an explicit Ads_1 tattoo-machine phase entered after Color entry tween completion.
- Show only the first collected `PatchSticker` during that phase; hide other patch nodes as needed.
- Add serialized `minOpacity`, `maxOpacity`, and flash duration/speed properties for the patch dots.
- Run a lightweight tween loop on the first patch dots opacity while the machine phase is active.
- Register global touch/click handling only during the machine phase and redirect to store once.
- Stop flashing, unregister listeners, and prevent repeated phase transitions/store calls.

### Out of scope

- Applying a selected Color UI choice to tattoo materials or changing ColorSelectionController behavior.
- Reworking line drawing, spray speed, patch ordering, or the fixed tattoo selection flow.
- Replacing the existing Text Wow art, Spine asset, final image asset, or tattoo machine visuals.
- Starting foam, confetti, Play More, or any phase after the store redirect.
- Supporting multiple selectable PatchSticker instances in this phase.

### Constraints

- Keep `finalImage` visible during Color entry and tattoo-machine phase.
- Use direct serialized references where the scene/prefab already uses them; do not add name-based lookup.
- The first patch is the source of truth for machine-phase flash (`patchs[0]`), matching the user's one-PatchSticker prefab setup.
- Preserve unrelated dirty worktree changes and do not commit without explicit permission.

## File-level change map

| File | Responsibility | Required change | Compatibility/runtime impact |
|---|---|---|---|
| `assets/scripts/src/context/TattooContext1.ts` | Owns Ads_1 phase flow and Color entry | Add explicit phase state/guards; start Text Wow before Color; wait for Spine completion; enter machine phase after Color tween; show first patch, start/stop flash, register global touch, redirect once | Existing serialized context remains compatible; one tween and one input listener only during final phase |
| `assets/scripts/src/context/TattoContext.ts` | Shared context and Text Wow/store helpers | Add a minimal completion-capable Text Wow hook only if the verified Spine API requires a shared helper; otherwise leave unchanged | Avoid changing behavior for other contexts |
| `assets/scripts/src/PatchSticker.ts` | Shared patch presentation | Add small methods to hide/show the patch and start/stop dots opacity flashing with serialized min/max/duration properties, or expose equivalent controlled state for `TatooContext1` | Existing drawing patch behavior must remain unchanged; flash tween must be stopped on cleanup |
| `assets/scripts/src/TattooLineSticker.ts` | Line patch collection/completion | Keep final-image reveal before completion transition; ensure final image is raised above all direct children before Text Wow callback; expose first patch through existing `patchs[0]` collection without changing ordering | No new assets; direct-child filtering remains required for finalImage node |
| `assets/Scene/Ads_1.scene` and owning prefab overrides | Active serialized scene references | Assign/verify first patch setup, final image, phase controller references and opacity settings through Creator; no manual UUID guessing | Requires Creator serialization validation |
| `assets/TattooAssets/prefab/ingame/Stickers/...` selected fixed prefab | Tattoo visual hierarchy | Ensure one intended `PatchSticker` is present, hidden initially, and its `Dots`/patch references are valid; retain final image node assignment | User controls prefab shape; no additional asset required |

## APIs and ownership

### `TatooContext1`

- `onCurrentStickerDone(): void`: one-shot entry from final line completion; reveals/raises final image already handled by sticker, starts Text Wow, and does not start Color until Wow completes.
- `onTextWowComplete(): void`: completion callback target; starts Color entry exactly once.
- `beginTattooMachinePhase(): void`: called by Color entry tween completion; sets phase guard, keeps final image active, hides non-first patch nodes, shows `patchs[0]`, starts flash, and registers global touch/click handlers.
- `onTattooMachineTouch(): void`: if phase is active and store not already triggered, marks store triggered, stops flash/listeners, and calls `gameEndHandler.StoreGameChangingNoCondition()`.
- `stopTattooMachinePhase(): void`: idempotent cleanup for scene disable/destroy or store redirect.

### `PatchSticker`

- Serialized `minOpacity: number`, `maxOpacity: number`, `flashDuration: number` (or equivalent speed) with safe positive defaults.
- `showMachinePatch(): void`: activates patch/dots and starts an opacity tween loop; must not register drawing input.
- `hideMachinePatch(): void`: stops flash tween, hides patch/dots, and restores a deterministic opacity.
- `startDotsFlash()`/`stopDotsFlash()` may remain private if `showMachinePatch`/`hideMachinePatch` are sufficient.

The patch flash owns only visual opacity; it must not set drawing eligibility or advance sticker gameplay.

## State and data flow

| State | Entry | Update | Exit |
|---|---|---|---|
| Drawing | Existing fixed tattoo patch flow | One tap/automatic line drawing | Final line completion |
| Final/Wow | Show final image, raise sibling, play non-looping Text Wow | Wait for verified Spine completion event | `onTextWowComplete()` |
| ColorEntry | Activate/reparent Color and tween to target | Existing Color entry tween | Tween completion |
| TattooMachine | Keep final image; show first PatchSticker; start dots flash; register root touch/click | Flash tween loops | First touch -> Store, scene cleanup, or disable |
| StoreTriggered | Stop flash/listeners and call store handler once | No further gameplay phase | External store transition |

One-shot guards must cover duplicate line callbacks, duplicate Spine callbacks, repeated Color tween completion, multi-touch, and both touch/mouse events on desktop preview.

## Subtasks

### Final image and Text Wow sequencing

- [in-progress] Verify the installed Cocos Spine completion event/API and wire a one-shot completion callback for the existing non-looping Text Wow animation; runtime/editor typings are unavailable here.
- [done] Ensure final image is activated and moved to the highest sibling index before Text Wow starts, while preserving its current visibility through later phases.
- [done] Replace direct Color entry start after line completion with the Text Wow completion transition.

### PatchSticker machine presentation

- [done] Add serialized flashing controls (`minOpacity`, `maxOpacity`, and positive duration/speed) to `PatchSticker`.
- [done] Implement idempotent show/hide machine presentation with a looping dots-opacity tween and cleanup.
- [done] Ensure the first collected patch is hidden during startup/drawing and shown only in machine phase; keep other patches inactive.

### Ads_1 machine phase and store touch

- [done] Add explicit machine-phase and store-trigger guards to `TatooContext1`.
- [done] Start the machine phase only after Color reaches `colorTargetNode` local zero.
- [done] Register global `TOUCH_START` and desktop `MOUSE_DOWN` only during machine phase, redirect once, and clean them up.
- [done] Stop flashing and machine-phase listeners on store redirect, disable, destroy, or repeated callbacks.

### Prefab/scene serialization

- [todo] Configure the fixed sticker prefab so its first patch is the intended `PatchSticker` and all required patch references are valid.
- [todo] Assign/verify final image and any new serialized opacity/speed values in Creator; retain `finalImage` active only at runtime.
- [todo] Confirm existing Color references (`BG`, `basePos`, `final`) and phase references resolve on the active Ads_1 instance.

### Validation

- [in-progress] Run `git diff --check`, targeted searches, and available TypeScript/Cocos diagnostics; Creator/compiler validation is unavailable here.
- [todo] Preview line completion: final image appears and is topmost before Text Wow starts.
- [todo] Confirm Color entry does not start until Text Wow Spine completes.
- [todo] Confirm final image remains visible during Color entry and tattoo-machine phase.
- [todo] Confirm only first PatchSticker appears in machine phase and its dots flash between configured opacity bounds.
- [todo] Confirm any touch/click during machine phase redirects once and stops the flash/listeners.
- [todo] Confirm touches before machine phase do not redirect to store.
- [todo] Validate repeated callbacks, rapid multi-touch, desktop mouse preview, and scene disable cleanup.

## Dependencies and implementation sequence

1. Verify Spine completion API and existing final-image ordering.
2. Implement PatchSticker flash controls and lifecycle.
3. Integrate explicit phase state and Text Wow -> Color -> machine transitions in `TatooContext1`.
4. Configure fixed prefab and Ads_1 serialized references in Creator.
5. Run static diagnostics and runtime acceptance checks.

## Performance and build impact

- No new textures, shaders, materials, or external dependencies.
- One tween loop affects one `UIOpacity` during the final phase; it stops on store/cleanup.
- Global input listeners exist only during tattoo-machine phase.
- No custom per-frame update loop or object instantiation is required.
- Existing final image renderer remains visible; additional cost is limited to one existing patch renderer and opacity updates.

## Compatibility and serialization considerations

- Preserve `@ccclass` names and existing serialized fields.
- Verify the actual Spine completion API from Cocos 3.8.7 typings; do not assume a Unity-style callback signature.
- Keep `finalImage` as a direct `Node` reference and raise it with `setSiblingIndex(this.node.children.length - 1)` after ensuring it is a direct child.
- Use `Input.EventType.TOUCH_START` and `MOUSE_DOWN` consistently with current Ads_1 setup; remove both listeners in cleanup.
- If the selected prefab's first patch is a `PatchSticker2`, use its inherited machine presentation methods without entering the old color-patch iterator phase.

## Edge cases and risks

- Spine completion may not fire if the animation name is missing or the Skeleton is disabled; add a clear diagnostic and a safe fallback only after verifying the available API.
- Existing `showTextWow()` has no callback; changing it globally could affect other contexts, so prefer an Ads_1-specific completion path if possible.
- `finalImage` is a direct child used alongside patch children; `TattooLineSticker.init()` must continue filtering non-patch children so the final image does not create null patch entries.
- Repeated final-line callbacks must not replay Wow, restart Color, or start multiple machine tweens.
- A touch bubbling to existing root tutorial handlers must not trigger store before the machine phase guard is true.
- If the fixed prefab contains no valid first patch, log a diagnostic and leave machine phase safely stopped rather than dereference null.

## Acceptance criteria

- Final line completion immediately reveals `finalImage` and places it above all other sticker children before Text Wow begins.
- Text Wow plays once and Color entry does not begin until its non-looping animation completes.
- `finalImage` remains visible during Color entry and tattoo-machine phase.
- After Color reaches its target, machine phase starts once and only the first collected PatchSticker is visible.
- First PatchSticker dots continuously tween opacity between configured `minOpacity` and `maxOpacity`.
- Any player touch/click during machine phase calls store exactly once; all subsequent touches are ignored and flash/listeners stop.
- Touches before machine phase do not call store.
- Duplicate callbacks and scene cleanup do not leave active tweens/listeners or trigger later phases.
- No new asset dependency or per-frame polling loop is introduced.

## Immediate next action

Run `$cook` against `D:/New folder/Projects/PLA_Tatoo/assets/plans/color-to-tattoo-machine-ads1/plan.md` after verifying the Spine completion API in the Cocos 3.8.7 environment.
