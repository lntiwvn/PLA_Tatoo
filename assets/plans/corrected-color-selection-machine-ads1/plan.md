# Corrected Ads_1 Final Image, Color Selection, and Tattoo Machine Flow

## Summary and selected direction

Correct the regression introduced by the previous machine-phase implementation. Preserve the original Text Wow trigger and timing; do not call `showTextWow()` again from `TatooContext1`. When the final line transitions toward the first `PatchSticker2`, immediately show `finalImage` and raise it above the completed line visuals before the existing Text Wow call. After the existing Wow delay/completion advances the sticker iterator, start Color entry. When Color reaches its target, keep Color and finalImage visible and begin color selection guidance. The first actual touch on color node `1`, `2`, or `3` locks that color and starts tattoo-machine phase. Tattoo-machine phase reactivates the first patch node, shows the existing tattoo machine, flashes patch dots, and redirects any later global touch/click to the store once.

## Repository Context / Implementation Surface

- Target repository: `D:/New folder/Projects/PLA_Tatoo`.
- Runtime: Cocos Creator `3.8.7`, TypeScript, mobile/WebGL playable ad.
- Active scene: `assets/Scene/Ads_1.scene`; flow owner is `assets/scripts/src/context/TattooContext1.ts`.
- Existing correct Text Wow trigger is in `TattooLineSticker.onPrayComplete()` when the next patch is `PatchSticker2` and the current patch is `PatchLineSticker`. It calls `window.tattoContext.showTextWow()` and advances after the existing 2-second timing.
- Regression: `TatooContext1.onCurrentStickerDone()` now calls `showTextWow()` again, producing a second playback. This call must be removed; the existing `TattooLineSticker` call remains the only playback.
- Root cause of missing final image: `showFinalImageOnly()` is currently called only when `nextSticker` is null. In the intended prefab, a `PatchSticker2` follows the final line, so `nextSticker` is non-null and finalImage is never enabled at that boundary.
- `showFinalImageOnly()` deactivates all direct children other than `finalImage`. This also deactivates the future PatchSticker component node; machine-phase presentation must reactivate the first patch component node before enabling its children/dots.
- Existing Color entry in `TatooContext1.startColorEntry()` is one-shot and preserves world position while reparenting `colorNode` to `colorTargetNode`.
- Regression: Color entry completion directly calls `beginTattooMachinePhase()` and that method calls `colorSelectionController.prepare()`, which hides `backgroundNode`. This skips selection and can hide Color after it arrives.
- `ColorSelectionController` currently registers `TOUCH_START` on the three actual `colorTargets`; `hand_tap` is presentation only. The selection is therefore already position-based on the color nodes, but no selection-completion callback exists.
- `ColorSelectionController.selectColor()` locks the first selection, stops the guidance tween/listeners, and activates the chosen indicator. It must additionally notify `TatooContext1` once.
- `PatchSticker.showMachinePatch()` currently activates `patchNode`/`dotsNode` and flashes dots, but not `PatchSticker.node`; it must reactivate the component node because final-image presentation previously disabled it.
- Existing tattoo-machine presentation in `TattooLineSticker.showNextPatch()` for non-line patches sets `tattoMachineOpacity.opacity = 255`. The corrected dedicated machine phase should restore the same presentation without registering spray/drawing input.
- Machine-phase global `TOUCH_START`/`MOUSE_DOWN` store redirect and exactly-once guard already exist in `TatooContext1`; they must remain disabled until after color selection.

## Target architecture and flow

```text
Final PatchLineSticker completes
    -> hide/unregister line machine
    -> finalImage active and raised above completed line nodes
    -> existing Text Wow plays once at its original call site
    -> existing Wow wait/completion advances to PatchSticker2
    -> PatchSticker2 is skipped as a drawing phase
    -> TatooContext1.onCurrentStickerDone()
       -> Color entry starts directly (no second Wow)
       -> Color reaches target
       -> ColorSelectionController.beginSelection(onSelected)
          -> Color remains visible
          -> text + hand guidance visible
          -> touch actual node 1/2/3
          -> lock selected indicator and stop guidance
          -> callback to TatooContext1
             -> tattoo-machine phase
             -> finalImage remains active
             -> Color remains active
             -> first PatchSticker node reactivated and dots flash
             -> tattoo machine visible
             -> subsequent global touch/click -> Store once
```

Gameplay truth is the one-time color selection callback. Hand movement does not select a color and cannot advance the phase. The machine-phase store listener becomes eligible only after selection finishes.

## Scope and constraints

### In scope

- Remove duplicate Text Wow playback while preserving its current correct call site and timing.
- Reveal and raise finalImage at the final-line-to-PatchSticker transition, before the existing Wow call.
- Keep finalImage active throughout Color entry, Color selection, and tattoo-machine phase.
- Start Color entry directly when the iterator reaches/skips `PatchSticker2` after Wow.
- Start selection guidance only after Color reaches its target.
- Advance to tattoo-machine phase only from a real touch on color target `1`, `2`, or `3`.
- Keep Color node visible after selection and through machine phase.
- Reactivate the first PatchSticker node and its presentation, show the existing tattoo machine, and retain dots flashing.
- Enable global store redirect only after the machine phase starts; keep exactly-once and cleanup behavior.

### Out of scope

- Selecting a color based on `hand_tap` position or animation progress.
- Applying the chosen palette color to tattoo materials.
- Re-enabling spray drawing in tattoo-machine phase.
- Changing the established Text Wow timing/art/audio/skin selection.
- Foam, confetti, Play More, or later gameplay.
- Supporting multiple active PatchSticker instances.

### Constraints

- `hand_tap` remains guidance only.
- The first actual color target touch is the only selection accepted; selection remains locked afterward.
- `finalImage` and Color BG must remain active in tattoo-machine phase.
- No runtime node-name lookup; keep serialized Color references and existing patch collection.
- Preserve unrelated dirty worktree changes and do not commit without explicit permission.

## File-level change map

| File | Current responsibility | Required correction | Runtime/serialization impact |
|---|---|---|---|
| `assets/scripts/src/TattooLineSticker.ts` | Patch iteration, line completion, final image | Move final-image reveal into the line-to-first-color-patch boundary before the existing Wow call; keep final image active; expose/retain the existing progression timing | No new serialized fields; fixes unreachable reveal path |
| `assets/scripts/src/context/TattooContext1.ts` | Ads_1 phase ownership | Remove duplicate Wow call; start Color directly; call selection after Color tween; receive one selection callback; start machine only afterward; show tattoo machine; do not call `prepare()` after Color entry | Existing guards retained; machine listener activation moves later |
| `assets/scripts/src/ColorSelectionController.ts` | Color UI initialization, hand guidance, touch selection | Accept/set a one-shot selection-completion callback; invoke it only from actual color target touch after locking selection; stop guidance without hiding Color BG | No new node references; callback is runtime-only |
| `assets/scripts/src/PatchSticker.ts` | Patch presentation and dots flashing | Ensure `showMachinePatch()` reactivates the component node as well as patch/dots; ensure cleanup does not accidentally hide finalImage/Color | Existing opacity properties remain serialized |
| `assets/scripts/src/context/TattoContext.ts` | Shared Text Wow helper | Revert/remove the optional completion-listener behavior if no remaining caller needs it; preserve the original single-play behavior for all contexts | Avoid global behavior change/regression |
| Active fixed sticker prefab and `Ads_1.scene` | Serialized references | Verify finalImage, first PatchSticker, Color controller, color targets, chosen indicators, and tattoo machine refs | Creator preview/serialization required |

## APIs and ownership

### `TattooLineSticker`

- `showFinalImageOnly(): void`: called once at the final `PatchLineSticker -> PatchSticker2` boundary before `showTextWow()`; activates finalImage, raises its sibling index, and hides completed line patch nodes.
- Existing `showNextPatch()` remains responsible for reaching `PatchSticker2`; Ads_1 skip logic then calls `onCurrentStickerDone()` without showing the patch as a drawing phase.

### `ColorSelectionController`

- `beginSelection(onSelected?: (index: number) => void): void`: stores a one-shot runtime callback, displays text/hand, and registers listeners on real color target nodes.
- `selectColor(index: number): void`: synchronously sets `hasSelected`, shows only the matching `chose`, stops guidance/listeners, then invokes the stored callback once with the selected index.
- `stopGuidance()` must hide only instruction text and hand; it must not deactivate `backgroundNode`.
- `prepare()` remains startup-only and may hide BG before entry. It must not be called from machine-phase transition.

### `TatooContext1`

- `onCurrentStickerDone(): void`: start Color entry directly; no Text Wow call.
- Color tween completion: call `colorSelectionController.beginSelection(index => beginTattooMachinePhase(index))`.
- `beginTattooMachinePhase(selectedIndex: number): void`: keep Color/finalImage active; reactivate first patch node; call `showMachinePatch()`; set `tattoMachineOpacity.opacity = 255`; register global store listeners.
- `stopTattooMachinePhase(): void`: unregister store listeners, stop patch flashing, and hide tattoo machine. It must not hide Color or finalImage before the external store transition.

## State and data flow

| State | Entry | Allowed input | Exit |
|---|---|---|---|
| Drawing | Existing line flow | Patch tap/drawing | Final line complete |
| Final/Wow | Show/raise finalImage; existing Wow playback | No color/store input | Existing iterator delay/completion |
| ColorEntry | Activate/reparent/tween Color | No color/store input | Tween completion |
| ColorSelection | Show text/hand; target listeners active | Touch color node 1/2/3 only | First valid selection callback |
| TattooMachine | Keep finalImage/Color; show first patch and machine; flash dots | Any global touch/click | Store once |
| StoreTriggered | Remove listeners and stop flash | None | External store transition |

## Subtasks

### Restore final-image and Wow boundary

- [done] Move finalImage reveal/raise to the `PatchLineSticker -> PatchSticker2` transition before the existing `showTextWow()` call.
- [done] Preserve the existing Text Wow call/timing and remove the second playback introduced in `TatooContext1`.
- [done] Ensure finalImage remains active through all later phase transitions.

### Restore Color entry and selection

- [done] Make `onCurrentStickerDone()` start Color entry directly and retain one-shot guards.
- [done] On Color tween completion, start `ColorSelectionController.beginSelection()` instead of machine phase.
- [done] Add a one-shot selection callback invoked only by touch on actual color target nodes.
- [done] Keep Color BG active after selection; do not call startup `prepare()` during the machine transition.

### Correct tattoo-machine phase

- [done] Reactivate the first PatchSticker component node before starting its patch/dots presentation.
- [done] Display the existing tattoo machine with the same opacity behavior as the previous color-patch phase, without enabling spray input.
- [done] Start global store touch/click listeners only after the color-selection callback.
- [done] Preserve exactly-once store redirect and clean up flash/listeners/machine presentation without hiding Color/finalImage.

### Shared helper cleanup

- [done] Remove/revert unused Text Wow completion-listener changes from `TattoContext.showTextWow()` if the corrected flow no longer needs them.
- [done] Confirm other contexts retain their original Text Wow behavior.

### Serialization and validation

- [todo] Verify `finalImage` is assigned on the active fixed prefab and is a direct child of `TattooLineSticker`.
- [todo] Verify first PatchSticker references and Color controller target/indicator references in Creator.
- [in-progress] Run `git diff --check`, targeted searches, and available TypeScript/Cocos diagnostics; Cocos Creator preview/compiler is unavailable here.
- [todo] Preview the complete flow and confirm exactly one Wow playback.
- [todo] Confirm finalImage appears before Wow and stays visible thereafter.
- [todo] Confirm Color remains visible after entry and selection.
- [todo] Confirm tapping hand_tap or empty space during ColorSelection does not select or start machine; tapping 1/2/3 does.
- [todo] Confirm first patch and tattoo machine appear only after selection, dots flash, and next global touch redirects once.

## Dependencies and implementation sequence

1. Correct the line-to-PatchSticker boundary and eliminate duplicate Wow playback.
2. Add the Color selection completion callback and restore Color entry -> selection ordering.
3. Move machine-phase activation behind selection and restore patch/tattoo-machine visibility.
4. Remove unused shared Wow callback code.
5. Validate serialized references and run full runtime flow.

## Performance and build impact

- No new assets, renderers, shaders, materials, or dependencies.
- Existing hand and dots tweens run in separate, non-overlapping phases.
- No custom per-frame update loop.
- Color selection has three target listeners; they are removed immediately after selection.
- Machine phase has one global touch/mouse listener pair and one opacity tween; all are cleaned on store/disable.

## Compatibility and serialization considerations

- Preserve existing `@ccclass` and serialized property names.
- Do not rely on Spine completion APIs in the corrected path because the project already owns the desired Wow trigger/timing.
- Callback state in `ColorSelectionController` must not be serialized and must be cleared during prepare/disable/destroy.
- Reactivating `PatchSticker.node` is necessary because final-image presentation disables sibling patch nodes.
- Keep finalImage topmost during Final/Wow and Color phases. In machine phase, the patch may be moved above finalImage only if required for its overlay to be visible; finalImage itself remains active.

## Risks and edge cases

- If finalImage is not assigned, the flow must log a diagnostic but still advance to Wow/Color rather than stall.
- A PatchSticker node disabled by `showFinalImageOnly()` cannot render even when its child patch/dots nodes are active; explicitly reactivate it.
- The same touch that selects a color may bubble to the newly registered global machine listener. Register machine listeners after the selection event finishes (for example on the next task/frame) or guard against consuming the selection touch as the store touch.
- Rapid multi-touch on color targets must result in one selected indicator and one machine-phase start.
- Calling `prepare()` after Color arrives would hide BG; prohibit it outside startup/reset.
- Cleanup must not call `hideMachinePatch()` in a way that hides the selected Color or finalImage, which are separate nodes.

## Acceptance criteria

- Text Wow plays exactly once at its original correct moment.
- finalImage becomes visible immediately after the final line completes, before Wow playback, and stays active for the remainder of the flow.
- Color entry starts only after the existing Wow transition finishes, without replaying Wow.
- When Color reaches target, selection text/hand appears and the machine phase does not start yet.
- A real touch inside color node 1, 2, or 3 selects that color regardless of hand_tap's current target; touching hand/empty space does not select.
- Selection locks once, shows the matching `chose`, hides text/hand, and keeps Color visible.
- After selection, the first PatchSticker node and tattoo machine become visible, and patch dots flash.
- The selection touch itself does not immediately redirect to store; the next global touch/click during machine phase redirects exactly once.
- finalImage and Color remain displayed during tattoo-machine phase.
- No foam, confetti, Play More, duplicate Wow, duplicate machine phase, or residual listener/tween remains.

## Immediate next action

Run `$cook` with `D:/New folder/Projects/PLA_Tatoo/assets/plans/corrected-color-selection-machine-ads1/plan.md`.
