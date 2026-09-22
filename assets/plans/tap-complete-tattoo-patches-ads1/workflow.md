# Workflow: Tap-to-Complete Tattoo Patches

## Selected direction

For the fixed single-tattoo flow in `Ads_1.scene`, one valid touch start completes the currently active tattoo patch immediately. Every patch still requires its own separate tap. Existing patch order, reveal/hide transitions, audio, machine presentation, tracking, and completion callbacks remain intact. Foam filling/clearing remains drag-based and is not changed.

## Phases

1. Inspect and update spray-patch touch ownership in `SprayPaintWithFade.ts`.
2. Inspect and update line-patch touch ownership in `StrokeLineWithPath.ts`.
3. Verify the existing sticker progression owners do not advance twice and still unregister the completed patch listener.
4. Run static validation and review the diff against unrelated size-reduction changes.
5. Preview `Ads_1.scene` in Cocos Creator when available and exercise one tap per patch plus foam dragging.

## Decision checkpoints

- A tap is accepted only on `TOUCH_START` while the component is the active patch and enabled.
- A completed patch must unregister/disable its drawing listeners before invoking progression.
- `TOUCH_MOVE`, path scheduling, spray-mask filling, and spray completion thresholds are no longer used to decide tattoo-patch completion.
- No changes are made to `FoamContext.ts` or foam input handling.

## Repository and implementation approach

Use the existing `window.tattoContext.currentSticker.onPrayComplete()` callback as the gameplay boundary. Add a per-component exactly-once guard, preserve existing start-side presentation/audio where safe, and leave `TattooSticker` and `TattooLineSticker` progression contracts unchanged unless inspection finds a duplicate-callback edge case.

## Validation/review approach

Use `git diff --check`, targeted searches, and TypeScript/static inspection. If Cocos Creator is available, preview `Ads_1.scene` and verify each tattoo patch needs one tap, rapid/repeated taps do not skip patches, and foam still requires dragging. Do not commit as part of this plan.

## Known risks and handling

- A `TOUCH_END` from the same tap could fire after `TOUCH_START`; unregister and guard before callback.
- Line patches currently schedule movement; cancel any schedule and reset movement state when switching to tap completion.
- Spray patches currently allocate/update mask buffers during movement; bypass those updates for tattoo completion while leaving initialization compatible with existing prefabs.
- Shared components may be reused between patches; reset the guard in `registerTouchEvent()` and clean up in `unRegisterTouchEvent()`.
