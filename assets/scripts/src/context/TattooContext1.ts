import { _decorator, Camera, CCFloat, input, Input, instantiate, Label, Node, Prefab, Tween, tween, UIOpacity, Vec3, VideoPlayer } from 'cc';
import { TattoContext } from './TattoContext';
import { TattooSticker } from '../TattooSticker';
import { TattooLineSticker } from '../TattooLineSticker';
import { PatchSticker2 } from '../PatchSticker2';
import { PatchLineSticker } from '../PatchLineSticker';
import { ConcreteAggregate } from '../Iterator/ConcreteAggregate';
import { ColorSelectionController } from '../ColorSelectionController';
import gameEndHandler from '../../../PLAGameFoundation/gameControl/utilities/handler/gameEndHandler';
const { ccclass, property } = _decorator;

@ccclass('TatooContext1')
export class TatooContext1 extends TattoContext {
    @property(VideoPlayer)
    introVideo: VideoPlayer = null;

    @property(Node)
    endFrame: Node = null;

    @property(Prefab)
    fixedTattooPrefab: Prefab = null;

    @property(UIOpacity)
    selectTattOpacity: UIOpacity = null;
    @property(UIOpacity)
    backgroundContextOpacity: UIOpacity = null;

    @property(Node)
    modelNode: Node = null;

    isDrawMainTattoo: boolean = true;

    @property(Camera)
    tattooCamera: Camera = null;

    @property(Label)
    labelInk: Label = null;
    @property(Label)
    labelColor: Label = null;

    @property(Node)
    colorNode: Node = null;
    @property(Node)
    colorBeginNode: Node = null;
    @property(Node)
    colorTargetNode: Node = null;
    @property(CCFloat)
    colorEntryDuration = 0.5;

    @property(ColorSelectionController)
    colorSelectionController: ColorSelectionController = null;

    labelInkTween: Tween<UIOpacity>;
    labelColorTween: Tween<UIOpacity>;
    isFirstShowTextInk: boolean = true;

    isFirstStickerDone: boolean = false;
    private hasStartedDrawing: boolean = false;
    private colorEntryStarted = false;
    private tattooMachineStarted = false;
    private colorSelected = false;
    private machineInputReady = false;
    private machineInputRegistrationTimer: ReturnType<typeof setTimeout> = null;
    private readonly machineInputRegistrationDelay = 150;
    private isWaitingForIntroTap = false;
    private isIntroInputRegistered = false;

    start(): void {
        this.textTutorial.active = false;
        this.handTutorial.active = false;
        this.labelInk.node.active = false;
        this.labelColor.node.active = false;
        this.colorEntryStarted = false;
        this.tattooMachineStarted = false;
        this.colorSelected = false;
        this.colorSelectionController?.prepare();
        if (this.colorNode && this.colorBeginNode) {
            this.colorNode.setParent(this.colorBeginNode);
            this.colorNode.setPosition(Vec3.ZERO);
        }

        // The old entry UI/button is no longer part of the start flow.
        this.selectTattOpacity.node.active = false;
        this.playIntroVideo();
    }

    private playIntroVideo(): void {
        this.isWaitingForIntroTap = true;
        this.registerIntroInput();

        if (this.endFrame) {
            this.endFrame.active = false;
        } else {
            console.error('TatooContext1: endFrame is not assigned.');
        }

        if (!this.introVideo) {
            console.error('TatooContext1: introVideo is not assigned.');
            this.showEndFrameAndWaitForTap();
            return;
        }

        this.introVideo.node.active = true;
        this.introVideo.node.once(VideoPlayer.EventType.COMPLETED, this.onIntroVideoCompleted, this);
        this.introVideo.node.on(VideoPlayer.EventType.CLICKED, this.onIntroTap, this);
        this.introVideo.play();
    }

    private onIntroVideoCompleted(): void {
        if (this.introVideo) {
            this.introVideo.node.active = false;
        }
        this.showEndFrameAndWaitForTap();
    }

    private showEndFrameAndWaitForTap(): void {
        if (this.endFrame) {
            this.endFrame.active = true;
        }

        this.registerIntroInput();
    }

    private registerIntroInput(): void {
        if (this.isIntroInputRegistered) {
            return;
        }

        this.isIntroInputRegistered = true;
        input.on(Input.EventType.TOUCH_START, this.onIntroTap, this);
        input.on(Input.EventType.MOUSE_DOWN, this.onIntroTap, this);
    }

    private onIntroTap(): void {
        if (!this.isWaitingForIntroTap) {
            return;
        }

        this.isWaitingForIntroTap = false;
        this.unregisterIntroInput();
        if (this.introVideo) {
            this.introVideo.node.off(VideoPlayer.EventType.COMPLETED, this.onIntroVideoCompleted, this);
            this.introVideo.stop();
            this.introVideo.node.active = false;
        }
        if (this.endFrame) {
            this.endFrame.active = false;
        }
        this.onClickDoIt();
    }

    private unregisterIntroInput(): void {
        this.isIntroInputRegistered = false;
        input.off(Input.EventType.TOUCH_START, this.onIntroTap, this);
        input.off(Input.EventType.MOUSE_DOWN, this.onIntroTap, this);
        if (this.introVideo) {
            this.introVideo.node.off(VideoPlayer.EventType.CLICKED, this.onIntroTap, this);
        }
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

    onPlay(): void {
        this.tattooStickers.length = 0;
        this.stickerTattoIndex = -1;
        this.loadTattooSticker(0);
        this.stickerAggregate = new ConcreteAggregate<TattooSticker>();
        this.stickerAggregate.addItem(this.tattooStickers);
        this.stickerIterator = this.stickerAggregate.createIterator();
        this.playNextSticker();
    }

    loadTattooSticker(_itemIndex: number) {
        const prefab = this.fixedTattooPrefab;
        if (!prefab) {
            console.error('TatooContext1: fixedTattooPrefab is not assigned.');
            return;
        }
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

    onCurrentStickerDone() {
        if (this.colorEntryStarted || this.tattooMachineStarted) {
            return;
        }
        this.colorEntryStarted = true;

        this.startColorEntry();
    }

    private startColorEntry(): void {

        if (!this.colorNode || !this.colorBeginNode || !this.colorTargetNode) {
            console.error('TatooContext1: Color entry references are not assigned.');
            return;
        }

        Tween.stopAllByTarget(this.colorNode);
        this.colorNode.active = true;
        this.colorNode.setParent(this.colorTargetNode, true);
        tween(this.colorNode)
            .to(this.colorEntryDuration, { position: Vec3.ZERO })
            .call(() => {
                console.log('Color node entry completed');
                this.beginTattooMachinePhase();
            })
            .start();
    }

    private beginTattooMachinePhase(): void {
        if (this.tattooMachineStarted) return;
        const sticker = this.tattooStickers[0] as TattooLineSticker;
        const firstPatch = sticker?.patchs?.find((patch) => !(patch instanceof PatchLineSticker));
        if (!firstPatch) {
            console.error('TatooContext1: first PatchSticker is not assigned.');
            return;
        }
        this.tattooMachineStarted = true;
        this.colorSelected = false;
        this.machineInputReady = false;
        sticker.patchs.forEach((patch) => {
            if (patch === firstPatch) patch.showMachinePatch();
            else patch.hideMachinePatch();
        });
        // showFinalImageOnly() may have hidden this child at the line-complete
        // boundary. Keep the selected machine patch visible for color selection.
        firstPatch.node.active = true;
        if (this.tattoMachineOpacity) {
            this.tattoMachineOpacity.opacity = 255;
        } else {
            console.error('TatooContext1: tattoo machine opacity reference is not assigned.');
        }
        if (this.tattoMachine) {
            this.tattoMachine.active = true;
        } else {
            console.error('TatooContext1: tattoo machine reference is not assigned.');
        }
        if (!this.colorSelectionController) {
            console.error('TatooContext1: Color selection controller is not assigned; store input remains disabled.');
            return;
        }
        this.colorSelectionController.beginSelection(() => {
            this.colorSelected = true;
            this.enableTextColorEffect();
            this.enableMachineStoreInput();
        });
    }

    private enableMachineStoreInput(): void {
        if (this.machineInputRegistrationTimer !== null || this.machineInputReady || !this.tattooMachineStarted) {
            return;
        }
        this.machineInputRegistrationTimer = setTimeout(() => {
            this.machineInputRegistrationTimer = null;
            if (!this.tattooMachineStarted || !this.colorSelected) return;
            this.machineInputReady = true;
            this.node.on(Input.EventType.TOUCH_START, this.onTattooMachineTouch, this);
        }, this.machineInputRegistrationDelay);
    }

    private onTattooMachineTouch(): void {
        if (!this.tattooMachineStarted || !this.colorSelected || !this.machineInputReady) return;
        // Keep the tattoo-machine presentation visible while the Store transition
        // is triggered. Only remove the input listeners; do not hide PatchSticker2.
        this.stopTattooMachinePhase(false);
        gameEndHandler.StoreGameChangingNoCondition();
    }

    private stopTattooMachinePhase(hideVisuals = true): void {
        if (this.machineInputRegistrationTimer !== null) {
            clearTimeout(this.machineInputRegistrationTimer);
            this.machineInputRegistrationTimer = null;
        }
        // this.machineInputReady = false;
        // this.colorSelected = false;
        // this.node.off(Input.EventType.TOUCH_START, this.onTattooMachineTouch, this);
        // this.node.off(Input.EventType.MOUSE_DOWN, this.onTattooMachineTouch, this);
        if (hideVisuals) {
            const sticker = this.tattooStickers[0] as TattooLineSticker;
            sticker?.patchs?.forEach((patch) => patch.hideMachinePatch());
        }
        // this.tattooMachineStarted = false;
    }

    onDestroy(): void {
        this.unregisterIntroInput();
        if (this.introVideo) {
            this.introVideo.node.off(VideoPlayer.EventType.COMPLETED, this.onIntroVideoCompleted, this);
        }
        this.stopTattooMachinePhase();
        this.node.off(Input.EventType.TOUCH_START, this.onTattooMachineTouch, this);
    }

    shouldSkipColorPatchPhase(): boolean {
        return true;
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
        if(this.labelInkTween) {
            this.labelInkTween.stop();
        }
        this.labelInk.getComponent(UIOpacity).opacity = 255;
        this.labelInk.node.active = false;
    }

    stopTextColorEffect() {
        if(this.labelColorTween) {
            this.labelColorTween.stop();
        }
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
