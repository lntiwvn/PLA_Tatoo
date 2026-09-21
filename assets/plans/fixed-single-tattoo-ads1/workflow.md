# Fixed Single-Tattoo Flow for Ads_1

## Selected Direction

Refactor the `Ads_1.scene` flow so the existing selection/wheel presentation is bypassed and a single large start button begins one drawing sequence using one serialized fixed tattoo prefab. The implementation keeps the existing `TatooContext1` drawing, foam, tutorial, completion, and CTA behavior, while removing front/back selection and two-sticker progression from this scene.

The fixed prefab is exposed as a scene property rather than inferred from preview sprite names. The current default assignment should be `TattooLineSticker_130`, matching the current fixed scene assignment in `Ads_1`; changing the tattoo later should require only changing the scene reference.

## Workflow Phases

1. **Scene and code preparation**
   - Add an explicit fixed-prefab property and single-sticker start path to `TatooContext1`.
   - Preserve the existing completion and play-more behavior.
   - Keep the current start button event as the entry point, renaming the handler only if the resulting serialized event is safer and clearer.

2. **Selection UI removal**
   - Deactivate the two `TattooSlider` instances and any wheel-specific touch targets in the `Ads_1` scene instance.
   - Retain the existing button visual/style and place it as the sole actionable control for starting the drawing phase.
   - Remove front/back preview updates and selection-only transitions from the active scene path.

3. **Single-sticker gameplay connection**
   - On the first start-button press, initialize the drawing presentation once.
   - Instantiate exactly one fixed prefab, create the existing sticker iterator with one item, and show its first patch.
   - Guard the start path against repeated taps and invalid/missing prefab configuration.

4. **Validation and review**
   - Verify scene serialization and component property assignments in Cocos Creator 3.8.7.
   - Exercise the full touch flow on mobile/WebGL preview: start, draw, foam fill/clear, completion, and CTA.
   - Confirm no second sticker, slider interaction, or front/back-specific logic remains reachable in `Ads_1`.

## Decision Checkpoints

- Confirm the fixed prefab is assigned to the scene property; default planned asset is `TattooLineSticker_130`.
- Confirm the start button is visible immediately and is the only control before drawing.
- Confirm the existing drawing tutorial remains after the start tap rather than beginning before the tap.
- Confirm the completion CTA remains unchanged.

## Repository and Implementation Approach

The repository is a Cocos Creator 3.8.7 TypeScript project. `Ads_1.scene` uses the `TatooContext1` component, whose current `onClickDoIt()` transition reads two slider selections and whose `onPlay()` resolves two prefab indices from preview sprite names. The plan changes that ownership so the context owns one fixed prefab reference and one-shot start state. The scene file supplies the fixed prefab and deactivates the selector presentation; the reusable `SelectTattoo.prefab` remains unchanged unless inspection during implementation proves its serialized hierarchy cannot be safely overridden at the scene instance level.

## Validation and Review Approach

- Use repository search and scene JSON inspection to verify all `Ads_1` references to sliders, preview sprites, and click events.
- Compile/type-check using the project’s existing Cocos/TypeScript workflow.
- Run `Ads_1.scene` in the Cocos preview and test touch start, drawing, foam transitions, completion, and CTA.
- Inspect the runtime hierarchy after tapping start to verify exactly one sticker instance exists.
- Test repeated taps and rapid/multi-touch input to ensure the start path is exactly-once.
- Check portrait layout and resized preview for button placement and drawing-camera framing.

## Known Risks and Handling

- **Serialized scene references:** adding/removing properties can invalidate scene assignments if not saved by Cocos Creator; verify the component property block and prefab UUID after editing.
- **Hidden wheel still intercepts touch:** deactivation must include the slider nodes and any blocking overlay or selector container, not only visual opacity.
- **Duplicate start:** use an explicit started/phase guard and disable the button on first accepted press.
- **Missing fixed prefab:** fail visibly in development and do not attempt an invalid array lookup; keep drawing inactive until configuration is corrected.
- **Stale two-sticker state:** reset sticker arrays/iterator before loading the fixed prefab and remove all front/back index derivation from the active path.
- **Dirty unrelated repository changes:** preserve existing user changes and limit edits to the planned script and `Ads_1.scene`.

