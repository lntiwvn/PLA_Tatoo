import { _decorator, CCFloat, Color, Component, EventTouch, Node, Sprite, Tween, tween, UITransform, Vec2, Vec3 } from 'cc';

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

    @property([Color])
    paintColors: Color[] = [new Color(114, 206, 56), new Color(235, 118, 109), new Color(235, 163, 53)];

    @property({ type: [Sprite], tooltip: 'Kéo Sprite của node inside từng lọ vào đây, cùng thứ tự với Color Targets. Màu tô lấy trực tiếp từ các Sprite này.' })
    paintColorSprites: Sprite[] = [];

    getPaintColor(index: number): Color {
        const tint = this.paintColorSprites[index]?.color;
        return (tint || this.paintColors[index] || new Color(114, 206, 56)).clone();
    }

    @property(Vec2)
    firstOffset: Vec2 = new Vec2(-20, 0);

    @property(Vec2)
    secondOffset: Vec2 = new Vec2(20, 0);

    @property(CCFloat)
    handMoveDuration = 0.35;

    private hasSelected = false;
    private isGuidanceRunning = false;
    private isSelectionEnabled = false;
    private targetIndex = 0;
    private handTween: Tween<Node> = null;
    private touchHandlers: ((event: EventTouch) => void)[] = [];
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

    beginSelection(onSelected?: (index: number) => void, hintIndex = 0): void {
        if (this.hasSelected || this.isGuidanceRunning) {
            return;
        }
        if (!this.validateReferences()) {
            return;
        }

        this.isGuidanceRunning = true;
        this.isSelectionEnabled = true;
        this.targetIndex = Math.max(0, Math.min(this.colorTargets.length - 1, Math.floor(hintIndex)));
        this.selectionCallback = onSelected || null;
        this.instructionText.active = true;
        this.handTap.active = true;
        this.touchHandlers = this.colorTargets.map((target, index) => {
            const handler = (event: EventTouch) => {
                // Selecting ink must not also paint beneath the palette.
                event.propagationStopped = true;
                this.selectColor(index);
            };
            target.on(Node.EventType.TOUCH_START, handler, this);
            return handler;
        });
        this.playTargetHint();
    }

    private validateReferences(): boolean {
        if (!this.instructionText || !this.handTap || this.colorTargets.length === 0
            || this.chosenIndicators.length !== this.colorTargets.length) {
            console.error('ColorSelectionController: assign text, handTap, and matching color target/indicator arrays.');
            return false;
        }
        if (this.colorTargets.some((target) => !target) || this.chosenIndicators.some((indicator) => !indicator)) {
            console.error('ColorSelectionController: color target or chosen indicator reference is missing.');
            return false;
        }
        if (this.paintColorSprites.length !== this.colorTargets.length || this.paintColorSprites.some((sprite) => !sprite)) {
            console.error('ColorSelectionController: assign each inside Sprite to Paint Color Sprites in the same order as Color Targets.');
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
                this.playTargetHint();
            })
            .start();
    }

    private selectColor(index: number): void {
        if (!this.isSelectionEnabled || !this.chosenIndicators[index]) {
            return;
        }

        this.hasSelected = true;
        this.stopGuidance(false);
        this.chosenIndicators.forEach((indicator, indicatorIndex) => {
            if (indicator) indicator.active = indicatorIndex === index;
        });
        this.selectionCallback?.(index);
    }

    private stopGuidance(removeInput = true): void {
        this.isGuidanceRunning = false;
        if (this.handTween) {
            this.handTween.stop();
            this.handTween = null;
        }
        if (removeInput) {
            this.isSelectionEnabled = false;
            this.colorTargets.forEach((target, index) => {
                if (target) {
                    const handler = this.touchHandlers[index];
                    if (handler) {
                        target.off(Node.EventType.TOUCH_START, handler, this);
                    }
                }
            });
            this.touchHandlers = [];
        }
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
