import { _decorator, CCFloat, Component, Node, Tween, tween, UITransform, Vec2, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('ColorSelectionController')
export class ColorSelectionController extends Component {
    @property(Node)
    backgroundNode: Node = null;

    @property(Node)
    instructionText: Node = null;

    @property(Node)
    handTap: Node = null;

    @property([Node])
    colorTargets: Node[] = [];

    @property([Node])
    chosenIndicators: Node[] = [];

    @property(Vec2)
    firstOffset: Vec2 = new Vec2(-20, 0);

    @property(Vec2)
    secondOffset: Vec2 = new Vec2(20, 0);

    @property(CCFloat)
    handMoveDuration = 0.35;

    private hasSelected = false;
    private isGuidanceRunning = false;
    private targetIndex = 0;
    private handTween: Tween<Node> = null;
    private touchHandlers: (() => void)[] = [];
    private selectionCallback: ((index: number) => void) = null;

    prepare(): void {
        this.stopGuidance();
        this.selectionCallback = null;
        this.hasSelected = false;
        this.targetIndex = 0;

        if (this.backgroundNode) {
            this.backgroundNode.active = false;
        }
        if (this.instructionText) {
            this.instructionText.active = false;
        }
        if (this.handTap) {
            this.handTap.active = false;
        }
        this.chosenIndicators.forEach((indicator) => {
            if (indicator) {
                indicator.active = false;
            }
        });
    }

    beginSelection(onSelected?: (index: number) => void): void {
        if (this.hasSelected || this.isGuidanceRunning) {
            return;
        }
        if (!this.validateReferences()) {
            return;
        }

        this.isGuidanceRunning = true;
        this.selectionCallback = onSelected || null;
        this.instructionText.active = true;
        this.handTap.active = true;
        this.touchHandlers = this.colorTargets.map((target, index) => {
            const handler = () => {
                this.selectColor(index);
            };
            target.on(Node.EventType.TOUCH_START, handler, this);
            return handler;
        });
        this.playTargetHint();
    }

    private validateReferences(): boolean {
        if (!this.instructionText || !this.handTap || this.colorTargets.length !== 3 || this.chosenIndicators.length !== 3) {
            console.error('ColorSelectionController: expected text, handTap, and three target/indicator references.');
            return false;
        }
        if (this.colorTargets.some((target) => !target) || this.chosenIndicators.some((indicator) => !indicator)) {
            console.error('ColorSelectionController: color target or chosen indicator reference is missing.');
            return false;
        }
        if (!this.handTap.parent || !this.handTap.parent.getComponent(UITransform)) {
            console.error('ColorSelectionController: handTap parent requires a UITransform.');
            return false;
        }
        return true;
    }

    private playTargetHint(): void {
        if (!this.isGuidanceRunning || this.hasSelected || !this.handTap) {
            return;
        }

        const target = this.colorTargets[this.targetIndex];
        const handParentTransform = this.handTap.parent.getComponent(UITransform);
        const targetWorld = target.worldPosition;
        const firstWorld = new Vec3(targetWorld.x + this.firstOffset.x, targetWorld.y + this.firstOffset.y, targetWorld.z);
        const secondWorld = new Vec3(targetWorld.x + this.secondOffset.x, targetWorld.y + this.secondOffset.y, targetWorld.z);
        const firstLocal = handParentTransform.convertToNodeSpaceAR(firstWorld);
        const secondLocal = handParentTransform.convertToNodeSpaceAR(secondWorld);
        firstLocal.z = this.handTap.position.z;
        secondLocal.z = this.handTap.position.z;
        const duration = Math.max(0.01, this.handMoveDuration);

        this.handTween = tween(this.handTap)
            .set({ position: firstLocal })
            .to(duration, { position: secondLocal })
            .to(duration, { position: firstLocal })
            .to(duration, { position: secondLocal })
            .to(duration, { position: firstLocal })
            .call(() => {
                if (!this.isGuidanceRunning || this.hasSelected) {
                    return;
                }
                this.targetIndex = (this.targetIndex + 1) % this.colorTargets.length;
                this.playTargetHint();
            })
            .start();
    }

    private selectColor(index: number): void {
        if (this.hasSelected || !this.isGuidanceRunning || !this.chosenIndicators[index]) {
            return;
        }

        this.hasSelected = true;
        this.stopGuidance();
        this.chosenIndicators[index].active = true;
        const callback = this.selectionCallback;
        this.selectionCallback = null;
        callback?.(index);
    }

    private stopGuidance(): void {
        this.isGuidanceRunning = false;
        if (this.handTween) {
            this.handTween.stop();
            this.handTween = null;
        }
        this.colorTargets.forEach((target, index) => {
            if (target) {
                const handler = this.touchHandlers[index];
                if (handler) {
                    target.off(Node.EventType.TOUCH_START, handler, this);
                }
            }
        });
        this.touchHandlers = [];
        if (this.instructionText) {
            this.instructionText.active = false;
        }
        if (this.handTap) {
            this.handTap.active = false;
        }
    }

    onDisable(): void {
        this.stopGuidance();
        this.selectionCallback = null;
    }

    onDestroy(): void {
        this.stopGuidance();
        this.selectionCallback = null;
    }
}
