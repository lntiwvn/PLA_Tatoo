import { _decorator, Component, sp, CCString } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('EndFrameHint')
export class EndFrameHint extends Component {
    @property(sp.Skeleton)
    handSkeleton: sp.Skeleton = null;

    @property(sp.Skeleton)
    effectSkeleton: sp.Skeleton = null;

    @property(CCString)
    handAnimation: string = 'speak';

    @property(CCString)
    effectAnimation: string = 'speak';

    onEnable(): void {
        this.unscheduleAllCallbacks();

        // Both Skeleton components live on child nodes. Start them after the
        // complete EndFrame hierarchy has finished enabling.
        this.scheduleOnce(this.play, 0);
    }

    onDisable(): void {
        this.unscheduleAllCallbacks();
        this.handSkeleton?.clearAnimations();
        this.effectSkeleton?.clearAnimations();
    }

    public play = (): void => {
        if (!this.enabled || !this.node.activeInHierarchy) return;

        if (!this.handSkeleton) {
            console.error('EndFrameHint: handSkeleton is not assigned.');
            return;
        }

        if (!this.effectSkeleton) {
            console.error('EndFrameHint: effectSkeleton is not assigned.');
            return;
        }

        this.handSkeleton.paused = false;
        this.effectSkeleton.paused = false;
        this.handSkeleton.clearAnimations();
        this.effectSkeleton.clearAnimations();

        const handTrack = this.handSkeleton.setAnimation(0, this.handAnimation, true);
        const effectTrack = this.effectSkeleton.setAnimation(0, this.effectAnimation, true);

        if (!handTrack) {
            console.error(`EndFrameHint: hand animation "${this.handAnimation}" was not found.`);
        }
        if (!effectTrack) {
            console.error(`EndFrameHint: effect animation "${this.effectAnimation}" was not found.`);
        }
    };
}
