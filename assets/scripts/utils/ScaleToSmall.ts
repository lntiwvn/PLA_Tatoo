import { _decorator, CCFloat, Component, tween, Tween, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('ScaleToSmall')
export class ScaleToSmall extends Component {
    @property({
        type: CCFloat,
        tooltip: 'Scale multiplier at the smallest point. Example: 0.9 means 90% of the original scale.',
    })
    smallScale = 0.9;

    @property({
        type: CCFloat,
        tooltip: 'Time in seconds used to shrink the CTA.',
    })
    shrinkDuration = 0.35;

    @property({
        type: CCFloat,
        tooltip: 'Time in seconds used to restore the CTA to its original scale.',
    })
    expandDuration = 0.35;

    @property({
        type: CCFloat,
        tooltip: 'Pause in seconds after each pulse.',
    })
    interval = 0.1;

    private readonly originalScale = new Vec3();
    private hasCapturedOriginalScale = false;

    protected onEnable(): void {
        if (!this.hasCapturedOriginalScale) {
            this.originalScale.set(this.node.scale);
            this.hasCapturedOriginalScale = true;
        }

        this.play();
    }

    protected onDisable(): void {
        this.stop();
    }

    protected onDestroy(): void {
        Tween.stopAllByTarget(this.node);
    }

    public play(): void {
        if (!this.hasCapturedOriginalScale) {
            this.originalScale.set(this.node.scale);
            this.hasCapturedOriginalScale = true;
        }

        Tween.stopAllByTarget(this.node);
        this.node.setScale(this.originalScale);

        const multiplier = Math.max(0, this.smallScale);
        const smallTarget = new Vec3(
            this.originalScale.x * multiplier,
            this.originalScale.y * multiplier,
            this.originalScale.z,
        );
        const shrinkTime = Math.max(0, this.shrinkDuration);
        const expandTime = Math.max(0, this.expandDuration);
        const pauseTime = Math.max(0, this.interval);

        tween(this.node)
            .to(shrinkTime, { scale: smallTarget }, { easing: 'sineInOut' })
            .to(expandTime, { scale: this.originalScale }, { easing: 'sineInOut' })
            .delay(pauseTime)
            .union()
            .repeatForever()
            .start();
    }

    public stop(): void {
        Tween.stopAllByTarget(this.node);
        if (this.hasCapturedOriginalScale && this.node?.isValid) {
            this.node.setScale(this.originalScale);
        }
    }

    public captureCurrentScale(): void {
        Tween.stopAllByTarget(this.node);
        this.originalScale.set(this.node.scale);
        this.hasCapturedOriginalScale = true;
        if (this.enabledInHierarchy) this.play();
    }
}
