import { _decorator, Camera, Input, instantiate, Label, Node, Prefab, Sprite, SpriteFrame, Tween, tween, UIOpacity } from 'cc';
import { TattoContext } from './TattoContext';
import { TattooSticker } from '../TattooSticker';
import { TattooLineSticker } from '../TattooLineSticker';
import { SlideSticker } from '../SlideSticker';
import { PatchSticker2 } from '../PatchSticker2';
import { ConcreteAggregate } from '../Iterator/ConcreteAggregate';
const { ccclass, property } = _decorator;

@ccclass('TatooContext1')
export class TatooContext1 extends TattoContext {
    @property(Prefab)
    fixedTattooPrefab: Prefab = null;

    @property([SpriteFrame])
    samples2: SpriteFrame[] = [];

    @property(Sprite)
    sampleIconFront: Sprite;
    @property(SlideSticker)
    slideStickerFront: SlideSticker = null;
    @property(SlideSticker)
    slideStickerBack: SlideSticker = null;

    @property(Sprite)
    stickerPreviewBack: Sprite = null;
    @property(Sprite)
    stickerPreviewFront: Sprite = null;

    @property(UIOpacity)
    selectTattOpacity: UIOpacity = null;
    @property(UIOpacity)
    backgroundContextOpacity: UIOpacity = null;
    @property(UIOpacity)
    samepleSpriteOpacity: UIOpacity = null;

    @property(Node)
    modelNode: Node = null;

    isDrawMainTattoo: boolean = true;

    @property(Camera)
    tattooCamera: Camera = null;

    @property(Label)
    labelInk: Label = null;
    @property(Label)
    labelColor: Label = null;

    labelInkTween: Tween<UIOpacity>;
    labelColorTween: Tween<UIOpacity>;
    isFirstShowTextInk: boolean = true;

    isFirstStickerDone: boolean = false;
    private hasStartedDrawing: boolean = false;

    start(): void {
        this.hideTattooSelectorWheels();
        this.textTutorial.active = false;
        this.handTutorial.active = false;
        this.labelInk.node.active = false;
        this.labelColor.node.active = false;
    }

    onClickDoIt() {
        if (this.hasStartedDrawing) {
            return;
        }

        if (!this.fixedTattooPrefab) {
            console.error('TatooContext1: fixedTattooPrefab is not assigned.');
            return;
        }

        this.hasStartedDrawing = true;
        this.handTutorial.active = false;
        this.textTutorial.active = false;

        this.selectTattOpacity.node.active = false;
        this.modelNode.active = false;

        tween(this.backgroundContextOpacity).to(0.5, {
            opacity: 255
        }).start();
        tween(this.samepleSpriteOpacity).to(0.5, {
            opacity: 255
        }).start();
        tween(this.selectTattOpacity).to(0.5, {
            opacity: 0
        }).call(() => {
            this.tattooCamera.usePostProcess = true;
            this.enableTextInkEffect();
        }).start();

        this.node.on(Input.EventType.TOUCH_START, this.onFirstTouch, this);
        this.node.on(Input.EventType.MOUSE_DOWN, this.onFirstTouch, this);
        this.audioManager.init();
        this.init();
        this.onIntro();
    }

    onScrollMainEnded(currentIndex: number) {
        this.textTutorial.active = false;
        // console.log('slide main: ', currentIndex, this.samples[currentIndex].texture);
        this.stickerPreviewFront.spriteFrame = this.samples[currentIndex];

        this.handTutorial.active = true;
    }

    onScrollSubEnded(currentIndex: number) {
        this.textTutorial.active = false;
        // console.log('slide sub: ', currentIndex, this.samples2[currentIndex].texture);
        // this.modelTattooSkinnedMeshRenderer.materials[0].setProperty("mainTexture2", this.samples2[currentIndex].texture)
        this.stickerPreviewBack.spriteFrame = this.samples2[currentIndex];
        this.handTutorial.active = true;
    }

    onPlay(): void {
        this.tattooStickers.length = 0;
        this.stickerTattoIndex = -1;
        this.loadTattooSticker(this.fixedTattooPrefab);
        this.stickerAggregate = new ConcreteAggregate<TattooSticker>();
        this.stickerAggregate.addItem(this.tattooStickers);
        this.stickerIterator = this.stickerAggregate.createIterator();
        this.playNextSticker();
    }

    private hideTattooSelectorWheels() {
        const selectorNode = this.selectTattOpacity?.node;
        if (!selectorNode) {
            return;
        }

        const hideWheelNodes = (node: Node) => {
            node.children.forEach((child) => {
                if (child.name.indexOf('TattooSlider') !== -1) {
                    child.active = false;
                    return;
                }
                hideWheelNodes(child);
            });
        };

        hideWheelNodes(selectorNode);
    }

    loadTattooSticker(prefab: Prefab) {
        let tattooNode = instantiate(prefab);
        tattooNode.parent = this.tattooStickerLayer;
        let tattooSticker = tattooNode.getComponent(TattooSticker);
        let tattooLineSticker = tattooNode.getComponent(TattooLineSticker);
        if (tattooSticker) {
            tattooSticker.init();
            this.tattooStickers.push(tattooSticker);
        } else {
            tattooLineSticker.init();
            this.tattooStickers.push(tattooLineSticker);
        }
    }

    onCurrentStickerClearFoamDone() {
        if (this.stickerIterator.getCurrentPosition() === 1) {
            this.isFirstStickerDone = true;
        }

        this.playNextSticker();
    }

    enableTextInkEffect() {
        this.labelInk.node.active = true;
        this.labelInkTween = tween(this.labelInk.getComponent(UIOpacity))
            .to(0.5, { opacity: 100 })
            .to(0.5, { opacity: 255 })
            .union()
            .repeatForever()
            .start();
    }

    stopTextInkEffect() {
        this.labelInkTween.stop();
        this.labelInk.getComponent(UIOpacity).opacity = 255;
        this.labelInk.node.active = false;
    }

    enableTextColorEffect() {
        this.isFirstShowTextInk = false;
        this.labelColor.node.active = true;
        this.labelColorTween = tween(this.labelColor.getComponent(UIOpacity))
            .to(0.5, { opacity: 100 })
            .to(0.5, { opacity: 255 })
            .union()
            .repeatForever()
            .start();
    }

    stopTextColorEffect() {
        this.labelColorTween.stop();
        this.labelColor.getComponent(UIOpacity).opacity = 255;
        this.labelColor.node.active = false;
    }

    playNextSticker() {
        this.currentSticker = this.stickerIterator.next();
        if (this.currentSticker) {
            this.stickerTattoIndex++;


            if (this.stickerTattoIndex - 1 >= 0) {
                this.tattooStickers[this.stickerTattoIndex - 1].patchs.forEach((patch) => {
                    if (patch instanceof PatchSticker2) {
                        patch.showOverlay();
                    }
                });
                // console.log(this.stickerTattoIndex, this.stickerTattoIndex - 1, this.tattooStickers[this.stickerTattoIndex - 1]);
            }

            this.currentSticker.showNextPatch();
        } else {
            this.tattooStickers.forEach((sticker) => {
                sticker.patchs.forEach((patch) => {
                    if (patch instanceof PatchSticker2) {
                        patch.hideOverlay();
                    }
                })
            });
            // console.log('done all sticker');
            this.showConfetti();
            this.playMoreButton.active = true;
        }
    }
}
