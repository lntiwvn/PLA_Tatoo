# Ads_1 Color Node Entry

## Summary and selected direction

After the single fixed tattoo finishes all patches, show only the colored `BG` node entry animation and stop there. Reparent `BG` from its Begin node to its Target node while preserving world position, then tween its local position to `Vec3.ZERO`. Log when the tween completes. Do not start foam, confetti, Play More, or any later phase.

## Repository Context / Implementation Surface

- Target repository: `D:/New folder/Projects/PLA_Tatoo`.
- Cocos Creator version: `3.8.7`; TypeScript/WebGL mobile playable-ad runtime.
- Scene: `assets/Scene/Ads_1.scene`.
- Context: `assets/scripts/src/context/TattooContext1.ts`, extending `TattoContext`.
- Existing scene-level completion: `TattoContext.onCurrentStickerDone()` starts foam fill; `TatooContext1` inherits this unless overridden.
- Existing color presentation: `assets/TattooAssets/prefab/ingame/TattoContext.prefab` contains container `Color`; colored node `BG` is under `final`, with sibling marker `basePos` under `Color`. The active references are `colorNode = BG`, `colorBeginNode = basePos`, and `colorTargetNode = final`.
- Existing tattoo completion callback: sticker controllers call `window.tattoContext.onCurrentStickerDone()` after all patches finish.
- Verified unknown: exact desired target node is not yet named in the repository evidence; implementation must use two explicit serialized `Node` references supplied in the scene/prefab rather than infer by node name.

## Target architecture

```text
All tattoo patches complete
    -> TatooContext1.onCurrentStickerDone()
    -> BG node entry guard
    -> BG.parent = final, keepWorldTransform = true
    -> tween BG.localPosition to Vec3.ZERO
    -> log completion
    -> remain stopped
```

Gameplay completion is known when the sticker callback fires. The reparent/tween is presentation only; tween completion must not trigger another gameplay phase.

## Scope and constraints

### In scope

- Override the Ads_1 completion boundary in `TatooContext1`.
- Add serialized Color node, Begin node, Target node, and optional entry duration references/properties.
- Initialize Color under Begin with local position zero.
- Reparent to Target preserving world transform, tween local position to zero, and log on completion.
- Serialize the references in the actual active Ads_1 context instance/prefab.

### Out of scope

- Foam fill/clear and foam input changes.
- Confetti, Play More, WOW text, analytics, or any phase after Color entry.
- Tattoo patch drawing speed/input changes already implemented.
- New assets, shaders, materials, or animation clips.

### Constraints

- One fixed tattoo and no front/back flow.
- Entry must be deterministic and one-shot even if completion callbacks repeat defensively.
- Preserve world position during reparenting.
- Keep unrelated worktree modifications untouched.
- Do not commit.

## File-level change map

| File | Responsibility | Required change | Compatibility/runtime impact |
|---|---|---|---|
| `assets/scripts/src/context/TattooContext1.ts` | Owns Ads_1 scene flow and fixed tattoo setup | Add Color entry references/state; initialize Color under Begin; override `onCurrentStickerDone()` to run entry once instead of foam; reparent with world transform, tween local position to zero, log completion | Existing `@ccclass` and serialized scene component remain compatible; one short tween, no new per-frame system |
| `assets/Scene/Ads_1.scene` or the directly owning context prefab | Serializes active Ads_1 node references | Assign Color, Begin, and Target nodes and entry duration if the context instance is scene-owned; otherwise preserve prefab references and only serialize scene overrides | Requires Cocos serialization validation; no asset dependency growth |
| `assets/TattooAssets/prefab/ingame/TattoContext.prefab` | Reusable context hierarchy containing Color/base position | Modify only if Begin/Target nodes are part of this prefab and cannot be referenced from the scene instance | Keep node hierarchy valid; do not rename existing nodes without need |

## APIs and ownership

- `colorNode: Node`: owned by `TatooContext1`; serialized reference to the colored `BG` node being moved.
- `colorBeginNode: Node`: serialized owner of initial Color placement.
- `colorTargetNode: Node`: serialized destination parent.
- `colorEntryDuration: number`: serialized duration in seconds; default should be a small positive value and remain editor-tunable.
- `colorEntryStarted: boolean`: owned by `TatooContext1`, reset on scene load and set before reparenting; prevents duplicate entry tweens/logs.
- `onCurrentStickerDone(): void`: override/callback boundary called by existing sticker progression after all patches; starts Color entry once and does not call the base foam implementation.

## State and data flow

| State | Entry | Update | Exit |
|---|---|---|---|
| Drawing | Existing fixed tattoo patch flow | Existing automatic patch drawing and progression | Final patch completion callback |
| Color-at-begin | Context initialization | Color remains under Begin at local zero | Final callback starts entry |
| Color-entering | `colorEntryStarted` set; parent changed preserving world transform | Tween local position toward zero | Tween completion logs and stops |
| Stopped | Tween completion | No foam/confetti/CTA or further gameplay phase | None in this task |

## Subtasks

### Context implementation

- [done] Add serialized Color/Begin/Target node references and entry duration/one-shot state.
- [done] Initialize Color under Begin with local position zero without disrupting existing context startup.
- [done] Override final sticker completion to start Color entry and bypass foam progression.
- [done] Reparent while preserving world transform, tween local position to zero, and log once on completion.

### Scene/prefab serialization

- [done] Identify the actual Begin and Target nodes in the active Ads_1 hierarchy (`BG`, `basePos`, `final`).
- [in-progress] Assign serialized references (`BG`, `basePos`, `final`) and verify Color starts at Begin/local zero in Cocos Creator; editor assignment is pending because Creator is unavailable in this environment.

### Validation

- [done] Run `git diff --check` and targeted reference searches.
- [done] Validate one final callback cannot create duplicate tweens/logs by guarding `colorEntryStarted`.
- [todo] Preview Ads_1 when Cocos Creator is available: finish all patches, observe Color entry, confirm the flow stops afterward.
- [todo] Verify no foam, confetti, Play More, or later callback runs.
- [todo] Check portrait/WebGL transform behavior and missing-reference diagnostics.

## Dependencies and implementation sequence

1. Identify serialized Begin/Target nodes in the active hierarchy.
2. Add context state and initialization.
3. Replace the Ads_1 final completion boundary with Color entry.
4. Serialize references in the scene/prefab.
5. Run static checks, then Cocos preview/manual acceptance.

## Performance and build impact

- No new textures, shaders, materials, dependencies, or draw systems.
- One-time node reparent and one tween after tattoo completion.
- No recurring update loop or allocations after the tween ends.

## Compatibility and serialization

- Preserve `@ccclass('TatooContext1')` and existing serialized properties.
- Use Cocos 3.8.7 `Node.setParent(target, true)`/equivalent world-preserving reparent behavior verified against project typings during implementation.
- Keep references typed as `Node`; do not add name-based runtime lookup.
- Missing references must log a clear error and leave the flow safely stopped.

## Risks and edge cases

- Wrong target assignment can place Color in an unexpected coordinate space; validate hierarchy and world position in preview.
- Repeated completion callback must not restart the tween or duplicate the log.
- A pre-existing Color tween must be stopped before a new entry begins.
- If Begin and Target have different scale/rotation, preserving world transform before tween is required.
- If the active scene uses prefab overrides, edits must be serialized on the actual Ads_1 instance rather than only the source prefab.

## Acceptance criteria

- After the last tattoo patch, Color is reparented from Begin to Target while retaining its world position at the transition.
- Color animates to Target local position `(0, 0, 0)` over the configured duration.
- Exactly one completion log is emitted after the entry tween finishes.
- The flow stops immediately after that log: no foam, confetti, Play More, or subsequent phase runs.
- Repeated completion callbacks do not duplicate animation or logs.
- Missing references fail safely with a diagnostic log.

## Immediate next action

Run the Cocos cook workflow against this plan after confirming the exact Begin and Target node references in `Ads_1.scene`/the context prefab.
