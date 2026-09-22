# Project Workflow

- Target: Cocos Creator 3.8.7 TypeScript mobile/WebGL playable ad in `D:/New folder/Projects/PLA_Tatoo`.
- Active scene: `assets/Scene/Ads_1.scene`; fixed single-tattoo flow is owned by `TatooContext1`.
- Gameplay ownership: tattoo/sticker controllers decide patch and sticker completion; context controls scene-level presentation and progression.
- Standard validation: targeted repository inspection, `git diff --check`, TypeScript/Cocos diagnostics when available, then Cocos Creator/WebGL preview for touch and animation behavior.
- Preserve unrelated dirty worktree changes and do not commit without explicit user authorization.
