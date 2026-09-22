# Ads_1 Color Selection Guidance

## Summary and selected direction

Extend the existing Color entry in `Ads_1.scene` with a one-time visual color selection. `BG` stays inactive from game start until its entry begins. After entry finishes, a dedicated `ColorSelectionController` on `BG` displays the instruction text and loops `hand_tap` over color nodes `1 -> 2 -> 3`. Each target receives two back-and-forth hint cycles between configurable `firstOffset` and `secondOffset`. The first `TOUCH_START` on a color locks the selection, hides the instruction/hand, and activates only that color's `chose` child. It does not recolor the tattoo or advance another phase.

## Repository Context / Implementation Surface

- Target repository: `D:/New folder/Projects/PLA_Tatoo`.
- Runtime: Cocos Creator `3.8.7`, TypeScript, mobile/WebGL playable ad.
- Active scene: `assets/Scene/Ads_1.scene`.
- Scene flow owner: `assets/scripts/src/context/TattooContext1.ts` (`@ccclass('TatooContext1')`).
- Existing completion route: the final tattoo line calls `TatooContext1.onCurrentStickerDone()`, which reparents `colorNode` while preserving world position and tweens it to `colorTargetNode` local zero.
- Existing hierarchy verified in `assets/TattooAssets/prefab/ingame/TattoContext.prefab`:

```text
Color
├─ basePos
└─ final
   └─ BG
      ├─ 1
      │  └─ chose
      ├─ 2
      │  └─ chose
      ├─ 3
      │  └─ chose
      ├─ text
      └─ hand_tap
```

- `BG`, `text`, `hand_tap`, and all three `chose` nodes currently serialize active in the prefab.
- Color nodes `1`, `2`, and `3` have `UITransform` but no `Button` or existing per-color touch component; the new controller must register node-level `Node.EventType.TOUCH_START` listeners.
- The current `Ads_1.scene` component fields `colorNode`, `colorBeginNode`, and `colorTargetNode` appear null in the component payload but also have prefab target overrides. Their effective runtime assignments must be verified in Creator after serialization changes.
- No name-based node lookup is allowed. Every participating node is supplied through serialized Inspector references.

## Target architecture

```text
Game initialization
    -> TatooContext1 positions BG under basePos
    -> ColorSelectionController.prepare()
       -> BG inactive
       -> all chose nodes inactive
       -> text and hand_tap inactive

Final tattoo line completes
    -> TatooContext1.onCurrentStickerDone()
    -> BG active
    -> existing BG reparent + entry tween
    -> tween completion
    -> ColorSelectionController.beginSelection()
       -> text active
       -> hand_tap active
       -> hint loop: 1 -> 2 -> 3 -> repeat

First valid color TOUCH_START
    -> selection lock set before presentation changes
    -> activate selected chose only
    -> hide text and hand_tap
    -> stop hand tween and unregister all color listeners
    -> remain stopped
```

Tattoo completion remains gameplay truth. Color entry, hint movement, and `chose` visibility are presentation/interaction state only. Selecting a color does not change tattoo data and does not trigger a later gameplay phase.

## Scope and constraints

### In scope

- Keep `BG` inactive from initialization until Color entry starts.
- Activate `BG` immediately before its existing reparent/entry tween.
- Add a controller with serialized references for `BG`, `text`, `hand_tap`, color targets `1/2/3`, and their corresponding `chose` nodes.
- Add serialized `Vec2 firstOffset`, `Vec2 secondOffset`, and an editor-tunable movement duration.
- Show text and begin the hand hint only after Color entry completes.
- Move the hand relative to each target's current world position, converted into the hand parent's local coordinate space.
- Perform two full back-and-forth movements per target, then advance `1 -> 2 -> 3 -> repeat` until selection.
- Accept only the first valid `TOUCH_START`; activate only its `chose`, then permanently lock selection for that scene run.
- Stop all hint animation and remove listeners when selected or when the component is disabled/destroyed.

### Out of scope

- Applying a selected color to the tattoo, material, texture, particles, or spray state.
- Allowing reselection, clearing a selection, or restarting the hint after selection.
- Resuming tattoo-machine, foam, confetti, Play More, WOW text, or another phase.
- Adding buttons, animation clips, textures, audio, analytics, or new art assets.
- Changing tattoo drawing speed or one-tap-per-patch behavior.

### Constraints

- All node references must be assigned via Inspector; do not use `find`, `getChildByName`, or traversal by node name.
- Touch-first mobile behavior; `TOUCH_START` is the selection event.
- Selection must be exactly once even under rapid/multi-touch input.
- Preserve unrelated dirty worktree changes and do not commit without explicit permission.

## File-level change map

| File | Current responsibility | Required change | Dependencies and impact |
|---|---|---|---|
| `assets/scripts/src/ColorSelectionController.ts` (new) | None | Own serialized Color UI references, initialization, hint tween sequence, touch listeners, exactly-once selection, and cleanup | Depends only on Cocos `Node`, `UITransform`, `Vec2/Vec3`, and tween APIs; one component and no asset growth |
| `assets/scripts/src/context/TattooContext1.ts` | Owns Ads_1 fixed tattoo flow and Color entry | Serialize/reference the Color selection controller; prepare it during startup; activate `BG` before entry; call `beginSelection()` only after the entry tween completes | Preserves existing completion routing and one-shot entry guard |
| `assets/TattooAssets/prefab/ingame/TattoContext.prefab` | Defines `Color/basePos/final/BG` hierarchy and Color UI nodes | Add/configure the controller on `BG`; assign `BG`, `text`, `hand_tap`, `1/2/3`, and three `chose` references; serialize offsets/duration; normalize initial active state where appropriate | Prefab serialization change; no new asset dependency |
| `assets/Scene/Ads_1.scene` | Owns active Ads_1 prefab instance and overrides | Assign the controller reference on `TatooContext1` and preserve/verify `colorNode = BG`, `colorBeginNode = basePos`, `colorTargetNode = final`; remove stale conflicting overrides only if Creator identifies them | Must be edited/validated through Cocos Creator to keep prefab override IDs valid |

## APIs and ownership

### `ColorSelectionController`

- `prepare(): void`
  - Caller: `TatooContext1.start()`.
  - Writes: resets `hasSelected`, hides every `chose`, `text`, and `hand_tap`, stops residual hand tween/listeners, and leaves `BG` inactive.
  - Lifecycle: once on scene startup; safe to call defensively before entry.
- `beginSelection(): void`
  - Caller: Color entry tween completion in `TatooContext1.onCurrentStickerDone()`.
  - Preconditions: `BG` is active and entry is complete; all serialized references are valid.
  - Writes: shows text/hand, registers one listener per target, and starts target index `0`.
  - Idempotence: repeated calls after start or selection must not duplicate listeners/tweens.
- Private `selectColor(index: number): void`
  - Caller: bound `TOUCH_START` handler for one of the three targets.
  - Writes: sets the lock before any visual action, activates only the indexed `chose`, hides text/hand, stops the tween, and unregisters all listeners.
- Private hint-cycle method(s)
  - Resolve target world position at the start of each target cycle.
  - Convert both `worldPosition + firstOffset` and `worldPosition + secondOffset` into the local coordinate space of `hand_tap.parent` using its `UITransform`.
  - Run two complete `first -> second -> first` cycles, then advance the target index modulo three.
  - Before chaining, verify the component/node remains valid, active, and unselected.
- `onDisable()`/`onDestroy()` cleanup
  - Stop the active tween and unregister target listeners without mutating the locked choice.

### Serialized state

- `backgroundNode: Node`: `BG`; controller-owned visibility boundary.
- `instructionText: Node`: `text`.
- `handTap: Node`: `hand_tap`.
- `colorTargets: Node[]`: ordered exactly `[1, 2, 3]`.
- `chosenIndicators: Node[]`: ordered to match targets exactly.
- `firstOffset: Vec2`, `secondOffset: Vec2`: offsets interpreted in world/UI XY units relative to the active target.
- `handMoveDuration: number`: duration of one directional leg; must be clamped or validated as positive.
- `hasSelected: boolean`: private runtime source of truth for the one-time lock.
- `isGuidanceRunning: boolean`: private guard against duplicate starts/listeners.

## State and data flow

| State | Entry actions | Allowed transition | Exit/cleanup |
|---|---|---|---|
| Prepared | Hide BG, text, hand, and all `chose`; reset guards | Tattoo completion starts Color entry | No touch listeners or running tween |
| Entering | Activate BG; preserve-world reparent; tween to target local zero | Entry tween completes | Existing entry tween ends once |
| Awaiting selection | Show text/hand; register listeners; run cyclic hint | First valid target `TOUCH_START` | Set lock first, then stop tween and unregister listeners |
| Selected/locked | Show only selected `chose`; hide text/hand | None | Component disable/destroy still performs defensive cleanup |

## Subtasks

### Controller implementation

- [done] Create `ColorSelectionController` with explicit serialized references, ordered target/indicator arrays, offsets, and movement duration.
- [done] Implement `prepare()` so BG and all selection presentation start hidden with no active tween/listeners.
- [done] Implement idempotent `beginSelection()` and register one `TOUCH_START` listener per color target.
- [done] Implement responsive world-to-local hand positions and the two-cycle-per-target `1 -> 2 -> 3 -> repeat` tween chain.
- [done] Implement exactly-once selection locking, selected-only `chose` visibility, text/hand hiding, and listener/tween cleanup.
- [done] Add `onDisable`/`onDestroy` cleanup and missing/mismatched-reference diagnostics.

### Context integration

- [done] Add a serialized `ColorSelectionController` reference to `TatooContext1`.
- [done] Call `prepare()` during startup after positioning BG at `basePos`.
- [done] Ensure BG is activated immediately before the existing Color entry begins.
- [done] Start selection guidance from the Color entry completion callback while retaining the single completion log and no-later-phase behavior.

### Prefab and scene serialization

- [in-progress] Attach/configure `ColorSelectionController` on `BG` in `TattoContext.prefab` with direct references to all required nodes (Creator serialization pending).
- [in-progress] Set and visually verify `firstOffset`, `secondOffset`, and `handMoveDuration` in Creator.
- [in-progress] Assign the controller to `TatooContext1` in `Ads_1.scene` and verify the effective BG/basePos/final references.
- [todo] Confirm prefab/scene initial active flags cannot flash BG, text, hand, or `chose` before runtime initialization.

### Static and runtime validation

- [done] Run `git diff --check` and targeted searches for name lookup, duplicate listeners, stale properties, and unintended phase calls.
- [in-progress] Run available TypeScript/Cocos diagnostics and resolve serialization/type errors (Creator/compiler unavailable in this environment).
- [todo] Preview `Ads_1.scene`: confirm BG remains hidden through drawing and becomes active only when entry starts.
- [todo] Verify entry completion shows text and begins the hand sequence in exact `1 -> 2 -> 3` order.
- [todo] Verify each target receives exactly two complete back-and-forth cycles before the next target and the sequence loops.
- [todo] Tap each color in separate runs and confirm only its `chose` appears, text/hand disappear, and further taps cannot alter selection.
- [todo] Stress rapid two-finger/repeated taps and confirm one deterministic winner with no residual tween/listener activity.
- [todo] Validate portrait/WebGL positioning and at least one alternate supported aspect ratio.
- [todo] Confirm no tattoo recolor and no tattoo-machine, foam, confetti, Play More, or subsequent phase begins.

## Dependencies and implementation sequence

1. Implement and statically validate the standalone controller.
2. Integrate controller lifecycle into the existing Color entry boundary.
3. Add prefab component and direct node references.
4. Assign scene reference and reconcile prefab overrides in Creator.
5. Run static diagnostics, then runtime touch/animation/aspect-ratio validation.

Controller logic depends on the ordered target/indicator pairing. Runtime validation depends on correct prefab and scene serialization. Do not manually guess serialized UUID/local-ID relationships when Creator can safely assign them.

## Performance and build impact

- No textures, audio, animation clips, shaders, materials, or third-party dependencies are added.
- Initialization and listener setup are one-time operations over exactly three targets.
- While awaiting selection, only one Cocos tween chain updates one node transform; it stops permanently on selection.
- World-to-local conversion occurs once per target cycle, not every frame.
- No custom `update()` loop, polling, instantiated nodes, or recurring allocations after selection.
- Existing renderer/draw-call count is unchanged; activating BG exposes only its existing UI renderers.

## Compatibility and serialization considerations

- Preserve existing `@ccclass('TatooContext1')` and serialized property names.
- Give the new component a stable `@ccclass('ColorSelectionController')`; retain its `.meta` file once Creator generates/imports it.
- Use Cocos 3.8.7 node event APIs and tween APIs already present in the project.
- Convert target world positions through `handTap.parent.getComponent(UITransform).convertToNodeSpaceAR(...)`; fail with a diagnostic if the required parent/UI transform is missing.
- Treat the configured arrays as a paired contract: both must contain exactly three non-null nodes in the same order.
- Offsets are XY-only; preserve the hand node's intended local Z during tween positions.
- Runtime initialization remains the authoritative guard against a one-frame prefab visibility mismatch, but prefab active flags should also be serialized hidden to avoid editor/activation flashes.

## Edge cases and risks

- A root-level context `TOUCH_START` listener may also receive the same event; it currently only hides older tutorial nodes and must not own color selection state.
- Rapid multi-touch can dispatch handlers before cleanup completes; set `hasSelected = true` synchronously at the first handler line after index validation.
- If a target or its ancestors move during a two-cycle hint, the hand follows the position sampled at that target-cycle start. This is acceptable because Color entry has completed before guidance begins.
- Different parent transforms, scale, anchors, or aspect ratios can break direct position addition; world-to-local conversion and alternate-aspect preview reduce this risk.
- Stopping a tween alone does not remove touch listeners; cleanup must always perform both actions.
- A missing controller reference must log clearly and leave BG visible at its final entry position without starting a later phase.
- Scene prefab overrides are already present for Color references; manual JSON edits risk stale local IDs and should be avoided unless validated against Creator serialization.

## Acceptance criteria

- From game start through tattoo drawing, `BG` is inactive and cannot receive color input.
- All three `chose` nodes are inactive before selection.
- At Color entry start, BG activates and performs the existing `basePos -> final` movement without a visible pre-entry flash.
- After entry completes, `text` and `hand_tap` are visible and the existing completion log occurs exactly once.
- The hand visits targets in `1 -> 2 -> 3 -> repeat` order and performs exactly two `firstOffset <-> secondOffset` back-and-forth cycles per target.
- Hand positions remain correct relative to each target in the supported mobile aspect ratios.
- The first color `TOUCH_START` activates only its paired `chose`, hides `text` and `hand_tap`, and permanently prevents any later color change.
- Rapid/multi-touch input results in exactly one selected indicator and no running guidance tween or registered color listeners afterward.
- Selection does not recolor the tattoo and does not start tattoo-machine, foam, confetti, Play More, or any later flow.
- No runtime name lookup, new visual asset, custom per-frame loop, or package dependency is introduced.

## Immediate next action

Run `$cook` with `D:/New folder/Projects/PLA_Tatoo/assets/plans/color-selection-guidance-ads1/plan.md`, then perform the prefab/scene assignments in Cocos Creator before runtime validation.
