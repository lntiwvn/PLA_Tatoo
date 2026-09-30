import { Animation, _decorator, Button, Camera, Component, instantiate, Node, Prefab, tween, Tween, UITransform, Vec3 } from 'cc';
import { SuperHtml } from './SuperHtml';
const { ccclass, property } = _decorator;

@ccclass('PopupManager')
export class PopupManager extends Component {
    public static instance: PopupManager | null = null;

    @property({ type: Node, tooltip: 'Lose popup node.' })
    losePopup: Node | null = null;

    @property({ type: Node, tooltip: 'Win popup node.' })
    winPopup: Node | null = null;

    @property({ type: Node, tooltip: 'Final end-card popup node shown after the last stage is won.' })
    endCardPopup: Node | null = null;

    @property({ type: Button, tooltip: 'CTA button that pops in after the final end card appears.', group: 'End Card CTA' })
    endCardButton: Button | null = null;

    @property({ type: Node, tooltip: 'UI parent used for the end-card tap hand. Usually the EndCardPopup node.', group: 'End Card CTA' })
    endCardTapHandParent: Node | null = null;

    @property({ type: Prefab, tooltip: 'Tap-hand prefab shown after the end-card button pop finishes.', group: 'End Card CTA' })
    endCardTapHandPrefab: Prefab | null = null;

    @property({ min: 0, max: 5, step: 0.01, tooltip: 'Delay after the end card appears before the button pops in.', group: 'End Card CTA' })
    endCardButtonDelay = 0.25;

    @property({ min: 0.05, max: 2, step: 0.01, group: 'End Card CTA' })
    endCardButtonPopDuration = 0.32;

    @property({ min: 1, max: 2, step: 0.01, group: 'End Card CTA' })
    endCardButtonPopScale = 1.16;

    @property({ min: 0, max: 3, step: 0.01, tooltip: 'Delay after the button pop finishes before the hand appears.', group: 'End Card CTA' })
    endCardTapHandDelay = 0.1;

    @property({ min: 0.01, max: 3, step: 0.01, group: 'End Card CTA' })
    endCardTapHandScale = 0.6;

    @property({ tooltip: 'Horizontal offset from the button center.', group: 'End Card CTA' })
    endCardTapHandOffsetX = 0;

    @property({ tooltip: 'Vertical offset from the button center.', group: 'End Card CTA' })
    endCardTapHandOffsetY = 0;

    @property({ type: Node, tooltip: 'Shop popup node.' })
    shopPopup: Node | null = null;

    @property({ type: Node, tooltip: 'Start popup node.' })
    startPopup: Node | null = null;

    @property({ type: Node, tooltip: 'Revive popup node.' })
    revivePopup: Node | null = null;

    @property({ type: Node, tooltip: 'Tutorial popup node.' })
    tutPopup: Node | null = null;

    @property({ type: Camera, tooltip: 'Main camera' })
    mainCamera: Camera | null = null;

    private _endCardButtonBaseScale = new Vec3(1, 1, 1);
    private _endCardButtonScaleCaptured = false;
    private _endCardTapHand: Node | null = null;
    private _endCardSequenceToken = 0;
    private _endCardButtonBound = false;

    onLoad() {
        if (PopupManager.instance && PopupManager.instance !== this) {
            // this.destroy();
            return;
        }
        PopupManager.instance = this;
        this.captureEndCardButtonScale();
        this.bindEndCardButton();
        this.resetEndCardCta();
    }

    onDestroy() {
        this.cancelEndCardCtaSequence();
        this.unbindEndCardButton();
        if (PopupManager.instance === this) {
            PopupManager.instance = null;
        }
    }

    /** Show lose popup */
    public ShowLosePopup(): void {
        if (this.losePopup) {
            this.PositionPopupAtCamera(this.losePopup, 100);
            this.losePopup.active = true;
        }
    }

    /** Hide lose popup */
    public HideLosePopup(): void {
        if (this.losePopup) {
            this.losePopup.active = false;
        }
    }

    /** Show win popup */
    public ShowWinPopup(): void {
        if (this.winPopup) {
            this.PositionPopupAtCamera(this.winPopup);
            this.winPopup.active = true;
        }
    }

    /** Hide win popup */
    public HideWinPopup(): void {
        if (this.winPopup) {
            this.winPopup.active = false;
        }
    }

    public ShowEndCardPopup(): void {
        if (this.endCardPopup) {
            this.cancelEndCardCtaSequence();
            this.resetEndCardCta();
            this.PositionPopupAtCamera(this.endCardPopup);
            this.endCardPopup.active = true;
            this.playEndCardCtaSequence();
        }
    }

    public HideEndCardPopup(): void {
        this.cancelEndCardCtaSequence();
        this.resetEndCardCta();
        if (this.endCardPopup) {
            this.endCardPopup.active = false;
        }
    }

    /** Show shop popup */
    public ShowShopPopup(): void {
        if (this.shopPopup) {
            this.PositionPopupAtCamera(this.shopPopup);
            this.shopPopup.active = true;
        }
    }

    /** Hide shop popup */
    public HideShopPopup(): void {
        if (this.shopPopup) {
            this.shopPopup.active = false;
        }
    }

    /** Show start popup */
    public ShowStartPopup(): void {
        if (this.startPopup) {
            this.PositionPopupAtCamera(this.startPopup);
            this.startPopup.active = true;
        }
    }

    /** Hide start popup */
    public HideStartPopup(): void {
        if (this.startPopup) {
            this.startPopup.active = false;
        }
    }

    public ShowTutPopup(levelIndex: number, onOk?: () => void): boolean {
        if (!this.tutPopup) return false;
        this.PositionPopupAtCamera(this.tutPopup);
        const popup = this.tutPopup.getComponent('TutPopup') as Component & {
            showForLevel?: (levelIndex: number, onOk?: () => void) => void;
        };
        if (!popup?.showForLevel) return false;
        popup.showForLevel(levelIndex, onOk);
        return true;
    }

    public HideTutPopup(): void {
        const popup = this.tutPopup?.getComponent('TutPopup') as Component & {
            hide?: () => void;
        };
        if (popup?.hide) popup.hide();
        else if (this.tutPopup) this.tutPopup.active = false;
    }

    /** Show revive popup */
    public ShowRevivePopup(): void {
        if (this.revivePopup) {
            this.PositionPopupAtCamera(this.revivePopup);
            this.revivePopup.active = true;
        }
    }

    /** Hide revive popup */
    public HideRevivePopup(): void {
        if (this.revivePopup) {
            this.revivePopup.active = false;
        }
    }

    /** Position popup tại giữa camera */
    private PositionPopupAtCamera(popup: Node, minus: number = 0    ): void {
        // if (!this.mainCamera) return;
        // const camPos = this.mainCamera.node.worldPosition;
        // this.node.worldPosition = new Vec3(camPos.x, camPos.y - minus, 0);
    }

    private playEndCardCtaSequence(): void {
        const button = this.endCardButton;
        if (!button?.node?.isValid) {
            console.warn('[PopupManager] Assign endCardButton in the Inspector.');
            return;
        }

        const token = ++this._endCardSequenceToken;
        this.scheduleOnce(() => {
            if (token !== this._endCardSequenceToken || !button.node.isValid || !this.endCardPopup?.activeInHierarchy) return;

            const node = button.node;
            const base = this._endCardButtonBaseScale;
            const peak = Math.max(1, this.endCardButtonPopScale);
            node.active = true;
            button.interactable = false;
            node.setScale(base.x * 0.01, base.y * 0.01, base.z);
            Tween.stopAllByTarget(node);
            tween(node)
                .to(Math.max(0.01, this.endCardButtonPopDuration), {
                    scale: new Vec3(base.x * peak, base.y * peak, base.z),
                }, { easing: 'backOut' })
                .to(0.12, { scale: new Vec3(base.x * 0.94, base.y * 0.94, base.z) }, { easing: 'sineOut' })
                .to(0.1, { scale: base.clone() }, { easing: 'sineOut' })
                .delay(Math.max(0, this.endCardTapHandDelay))
                .call(() => {
                    if (token !== this._endCardSequenceToken || !node.isValid) return;
                    node.setScale(base);
                    button.interactable = true;
                    this.showEndCardTapHand();
                })
                .start();
        }, Math.max(0, this.endCardButtonDelay));
    }

    private showEndCardTapHand(): void {
        const buttonNode = this.endCardButton?.node;
        const parent = this.endCardTapHandParent;
        if (!buttonNode?.isValid || !parent?.isValid || !this.endCardTapHandPrefab?.isValid) {
            console.warn('[PopupManager] Assign endCardTapHandParent and endCardTapHandPrefab in the Inspector.');
            return;
        }

        const buttonTransform = buttonNode.getComponent(UITransform);
        const parentTransform = parent.getComponent(UITransform);
        if (!buttonTransform || !parentTransform) {
            console.warn('[PopupManager] End-card button and hand parent require UITransform components.');
            return;
        }

        this.destroyEndCardTapHand();
        const hand = instantiate(this.endCardTapHandPrefab);
        this._endCardTapHand = hand;
        hand.setParent(parent);
        this.setNodeLayerRecursive(hand, parent.layer);

        const buttonWorldPosition = buttonTransform.convertToWorldSpaceAR(Vec3.ZERO);
        const handPosition = parentTransform.convertToNodeSpaceAR(buttonWorldPosition);
        handPosition.x += this.endCardTapHandOffsetX;
        handPosition.y += this.endCardTapHandOffsetY;
        handPosition.z = 0;
        hand.setPosition(handPosition);

        const authoredScale = hand.scale.clone();
        const scale = Math.max(0.01, this.endCardTapHandScale);
        hand.setScale(authoredScale.x * scale, authoredScale.y * scale, authoredScale.z * scale);
        hand.setSiblingIndex(parent.children.length - 1);
        hand.active = true;

        const animation = hand.getComponent(Animation) || hand.getComponentInChildren(Animation);
        if (animation?.isValid) animation.play(animation.defaultClip?.name);
    }

    private resetEndCardCta(): void {
        this.captureEndCardButtonScale();
        const button = this.endCardButton;
        if (button?.node?.isValid) {
            Tween.stopAllByTarget(button.node);
            button.node.setScale(this._endCardButtonBaseScale);
            button.node.active = false;
            button.interactable = false;
        }
        this.destroyEndCardTapHand();
    }

    private cancelEndCardCtaSequence(): void {
        this._endCardSequenceToken++;
        const buttonNode = this.endCardButton?.node;
        if (buttonNode?.isValid) Tween.stopAllByTarget(buttonNode);
    }

    private captureEndCardButtonScale(): void {
        if (this._endCardButtonScaleCaptured || !this.endCardButton?.node?.isValid) return;
        this._endCardButtonBaseScale.set(this.endCardButton.node.scale);
        this._endCardButtonScaleCaptured = true;
    }

    private bindEndCardButton(): void {
        const buttonNode = this.endCardButton?.node;
        if (this._endCardButtonBound || !buttonNode?.isValid) return;
        buttonNode.on(Button.EventType.CLICK, this.onEndCardButtonClick, this);
        this._endCardButtonBound = true;
    }

    private unbindEndCardButton(): void {
        const buttonNode = this.endCardButton?.node;
        if (this._endCardButtonBound && buttonNode?.isValid) {
            buttonNode.off(Button.EventType.CLICK, this.onEndCardButtonClick, this);
        }
        this._endCardButtonBound = false;
    }

    private onEndCardButtonClick(): void {
        this.destroyEndCardTapHand();
        SuperHtml.instance?.actDownload();
    }

    private destroyEndCardTapHand(): void {
        if (this._endCardTapHand?.isValid) this._endCardTapHand.destroy();
        this._endCardTapHand = null;
    }

    private setNodeLayerRecursive(node: Node, layer: number): void {
        node.layer = layer;
        for (const child of node.children) this.setNodeLayerRecursive(child, layer);
    }
}
