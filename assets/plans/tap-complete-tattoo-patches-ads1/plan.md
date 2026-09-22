# Ads_1 Tap-to-Complete Tattoo Patches

## Summary

Change tattoo patch interaction in the already-selected fixed single-tattoo `Ads_1` flow from drag/path completion to one tap per patch. A valid touch start completes the active tattoo patch immediately; the next patch becomes active through the existing progression flow and requires another tap. Foam interactions remain unchanged and drag-based.

## Existing architecture

- Cocos Creator `3.8.7`, TypeScript, mobile/WebGL playable-ad project.
- `TattooSticker` owns spray patch sequencing and calls `SprayPaintWithFade.registerTouchEvent()` for the active patch.
- `TattooLineSticker` owns line/path patch sequencing and registers either `StrokeLineWithPath` or spray input for the active patch.
- `SprayPaintWithFade` currently completes only after mask coverage during movement/end.
- `StrokeLineWithPath` currently schedules path movement on touch start and completes on touch end after all path points are visited.
- `TattooSticker.onPrayComplete()` and `TattooLineSticker.onPrayComplete()` hide the active patch, play existing presentation, and show the next patch or finish the sticker.
- Foam behavior is owned elsewhere and must remain drag-based.

## Target architecture and boundary

```text
Active tattoo patch TOUCH_START
    -> per-component guard accepts once
    -> stop/cancel active drawing work
    -> existing currentSticker.onPrayComplete()
    -> existing hide animation/delay
    -> next patch registers its own listener
```

The tattoo component is responsible only for accepting the patch tap exactly once. Sticker controllers remain responsible for progression and presentation. Foam remains its current input owner.

## Scope and constraints

### In scope

- `SprayPaintWithFade.ts`: tattoo patch touch-start completion and listener lifecycle.
- `StrokeLineWithPath.ts`: tattoo line patch touch-start completion and cancellation of scheduled path drawing.
- Minimal defensive changes in `TattooSticker.ts`/`TattooLineSticker.ts` only if static inspection identifies duplicate progression or reset requirements.
- Static/runtime validation of `Ads_1.scene` flow.

### Out of scope

- `FoamContext.ts` or foam drag semantics.
- Fixed tattoo selection, start-button flow, scene cleanup, or asset deletion already handled by prior work.
- New art, animations, audio, analytics taxonomy, or a new input framework.
- Renaming the browser-global `Window` interface.

### Constraints

- One fixed tattoo; no front/back flow.
- Each patch requires one separate tap.
- Preserve existing patch order, callbacks, animations, audio, machine presentation, tracking, confetti, and play-more behavior.
- Preserve unrelated dirty worktree changes and do not commit.

## File-level change map

| File | Current responsibility | Planned change | Runtime/serialization impact |
|---|---|---|---|
| `assets/scripts/src/SprayPaintWithFade.ts` | Registers global touch listeners and fills a spray mask until completion | Add/reset an exactly-once patch guard; on valid `TOUCH_START`, stop relevant presentation if needed, unregister or disable listeners, and invoke `currentSticker.onPrayComplete()` immediately; bypass movement-based completion for tattoo patches | No scene serialization change; removes per-patch drag CPU work |
| `assets/scripts/src/StrokeLineWithPath.ts` | Schedules and renders a line machine along path points | Add/reset an exactly-once guard; on valid `TOUCH_START`, cancel scheduled drawing, stop movement/audio, optionally snap/present the machine consistently, unregister listeners, and invoke the existing completion callback | No scene serialization change; avoids scheduled per-frame path work |
| `assets/scripts/src/TattooSticker.ts` | Sequences spray patches and unregisters completed spray input | Inspect only; retain progression contract, or make a minimal guard-compatible reset if required by component reuse | No asset impact |
| `assets/scripts/src/TattooLineSticker.ts` | Sequences line/spray patches and unregisters completed input | Inspect only; retain progression contract, or make a minimal guard-compatible reset if required by component reuse | No asset impact |

## APIs and ownership

- `patchCompleted: boolean` (name may follow project style) belongs to each tattoo input component. It is reset by `registerTouchEvent()`, read/written by touch handlers, and cleared on unregister only if needed for later reuse.
- Existing `onTouchStart(event: EventTouch)` remains the input API. It returns `void`; it accepts only when the component is currently enabled (`isCanPray`/`isCanDraw`) and not already completed.
- Existing `unRegisterTouchEvent()` remains the cleanup API and must remove all listeners and cancel any scheduled line draw.
- Existing `window.tattoContext.currentSticker.onPrayComplete()` remains the sole gameplay progression callback.

## State and data flow

| State | Entry | Update | Exit |
|---|---|---|---|
| Inactive | Before patch reveal or after unregister | Ignore all touch events | Active registration |
| Active/untapped | `registerTouchEvent()` after patch reveal | First valid `TOUCH_START` is accepted; later starts ignored | Completing |
| Completing | Guard set before callback | No drawing, no path scheduling, no duplicate callback | Unregistered/next patch or sticker complete |

The guard is local to the active patch component; the sticker iterator remains the source of truth for patch order and completion.

## Subtasks

### Tattoo spray input

- [done] Add an exactly-once completion guard and reset it on registration.
- [done] Make valid `TOUCH_START` complete the active spray patch immediately.
- [done] Prevent `TOUCH_MOVE`, `TOUCH_END`, and `TOUCH_CANCEL` from causing a second completion after the tap.

### Tattoo line input

- [done] Add an exactly-once completion guard and reset it on registration.
- [done] Replace path scheduling on touch start with immediate patch completion.
- [done] Cancel scheduled drawing and stop line movement/audio during completion cleanup.

### Progression compatibility

- [done] Inspect `TattooSticker` and `TattooLineSticker` callback/unregister ordering for duplicate advancement.
- [done] Apply only minimal guard/reset changes if component reuse requires them.

### Validation

- [done] Run `git diff --check` and targeted searches for remaining tattoo drag/path completion paths.
- [todo] Preview `Ads_1.scene` and verify one tap advances exactly one patch.
- [todo] Verify foam still requires drag input and existing completion presentation remains intact.
- [todo] Verify rapid taps, touch cancel, multi-touch, and resize/WebGL behavior.

## Dependencies and implementation sequence

1. Modify spray input and its listener guard.
2. Modify line input and cancel scheduled work.
3. Inspect and minimally adjust progression controllers if needed.
4. Run static validation and review only the intended files.
5. Run Cocos Creator preview/manual acceptance checks.

## Performance and build impact

- No new assets, materials, shaders, prefabs, or dependencies.
- One tap avoids repeated 512×512 spray-mask fill checks and line path scheduling for tattoo patches.
- Per-patch work is limited to existing callback/presentation operations and listener cleanup.
- No additional allocations should occur on repeated taps; the guard must reject them.

## Compatibility and serialization

- Keep existing `@ccclass` names, serialized properties, prefab wiring, and scene UUIDs unchanged.
- Use Cocos 3.8.7 event/listener APIs already present in the files.
- Do not hand-edit `Ads_1.scene` unless implementation proves a serialized change is required.

## Edge cases and risks

- `TOUCH_START` followed by `TOUCH_END` must not invoke completion twice.
- `TOUCH_CANCEL` must be harmless after completion and must not advance a second patch.
- A rapid second tap during the existing hide delay must not skip the next patch.
- Shared/global context listeners must be removed before the next patch registers.
- Line `schedule()` callbacks must not continue after completion.
- Foam nodes may receive the same global touch stream; tattoo changes must not alter foam ownership or thresholds.

## Acceptance criteria

- Each visible tattoo patch completes on its first valid tap, with no drag required.
- Each subsequent patch requires a separate tap.
- No patch can complete twice from one tap, touch end/cancel, rapid taps, or multi-touch.
- Existing patch ordering, hide/show timing, machine/audio presentation, tracking, and final completion remain intact.
- Foam still requires drag interaction and behaves as before.
- No scene/prefab/asset dependency changes are introduced by this gameplay update.
- Static checks pass; Cocos preview, when available, shows the expected flow on mobile/WebGL dimensions.

## Immediate next action

Run the Cocos cook workflow against this plan, starting with `SprayPaintWithFade.ts` and `StrokeLineWithPath.ts`, then validate the fixed single-tattoo `Ads_1.scene` flow.
