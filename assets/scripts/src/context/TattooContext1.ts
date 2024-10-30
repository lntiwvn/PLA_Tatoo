import { _decorator, Camera, Input, instantiate, Label, Material, Node, SkinnedMeshRenderer, Sprite, SpriteFrame, Tween, tween, UIOpacity } from 'cc';
import { TattoContext } from './TattoContext';
import { TattooSticker } from '../TattooSticker';
import { TattooLineSticker } from '../TattooLineSticker';
import { SlideSticker } from '../SlideSticker';
import { PatchSticker2 } from '../PatchSticker2';
const { ccclass, property } = _decorator;

@ccclass('TatooContext1')
export class TatooContext1 extends TattoContext {
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

    start(): void {
        // console.log(this.tattooItemPrefab[0].name.split('_')[1]);

        this.slideStickerFront.onScrollEnded = this.onScrollMainEnded.bind(this);
        this.slideStickerBack.onScrollEnded = this.onScrollSubEnded.bind(this);
        this.stickerPreviewFront.spriteFrame = this.samples[0];
        this.stickerPreviewBack.spriteFrame = this.samples2[0];
        this.textTutorial.active = true;
        this.labelInk.node.active = false;
        this.labelColor.node.active = false;
    }

    onClickDoIt() {
        this.handTutorial.active = false;
        this.textTutorial.active = false;

        // console.log('main', this.slideStickerMain.currentSlideIndex);
        // console.log('sub', this.slideStickerSub.currentSlideIndex);

        this.selectTattOpacity.node.active = false;

        this.sampleIconFront.spriteFrame = this.samples[this.slideStickerFront.currentSlideIndex];
        this.sampleSprite.spriteFrame = this.samples2[this.slideStickerBack.currentSlideIndex];

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
        let stickerFrontName = this.stickerPreviewFront.spriteFrame.name.split('_')[1];
        let stickerBackName = this.stickerPreviewBack.spriteFrame.name.split('_')[1];
        let stickerFrontIndex = this.getPrefabIndexFromName(stickerFrontName);
        let stickerBackIndex = this.getPrefabIndexFromName(stickerBackName);

        console.log('stickerFrontName', stickerFrontName);
        console.log('stickerBackName', stickerBackName);
        console.log('stickerFrontIndex', stickerFrontIndex);
        console.log('stickerBackIndex', stickerBackIndex);

        this.loadAllStickerPlay([stickerBackIndex, stickerFrontIndex]);
        this.playNextSticker();
    }

    getPrefabIndexFromName(name: string): number {
        return this.tattooItemPrefab.findIndex((prefab) => prefab.name.split('_')[1] === name);
    }

    loadTattooSticker(itemIndex: number) {
        let tattooNode = instantiate(this.tattooItemPrefab[itemIndex]);
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
