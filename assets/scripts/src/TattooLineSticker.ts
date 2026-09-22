import { _decorator, CCString, Component, Node, Vec3 } from 'cc';
import { PatchSticker } from './PatchSticker';
import { ConcreteAggregate } from './Iterator/ConcreteAggregate';
import { Iterator } from './Iterator/Iterator';
import { PatchLineSticker } from './PatchLineSticker';
import { PatchSticker2 } from './PatchSticker2';
const { ccclass, property } = _decorator;

@ccclass('TattooLineSticker')
export class TattooLineSticker extends Component {

    patchs: PatchSticker[] = [];

    stickerAggregate: ConcreteAggregate<PatchSticker>;
    stickerIterator: Iterator<PatchSticker>;
    currentPatchSticker: PatchSticker;

    @property(Node)
    finalImage: Node = null;

    init() {
        this.patchs = [];
        this.patchs = this.node.children.map((node) => {
            let pathLine = node.getComponent(PatchLineSticker);
            let pathSticker2 = node.getComponent(PatchSticker2);

            if (pathLine) {
                return pathLine;
            }

            if (pathSticker2) {
                return pathSticker2;
            }

            const patchSticker = node.getComponent(PatchSticker);
            if (patchSticker) {
                return patchSticker;
            }
            return null;
        }).filter((sticker): sticker is PatchSticker => sticker !== null);

        if (this.finalImage) {
            this.finalImage.active = false;
        }


        this.patchs.forEach((sticker) => {
            sticker.init();
            sticker.hideMachinePatch();
        });

        this.stickerAggregate = new ConcreteAggregate<PatchSticker>();
        this.stickerAggregate.addItem(this.patchs);
        this.stickerIterator = this.stickerAggregate.createIterator();
    }

    showNextPatch() {
        this.currentPatchSticker = this.stickerIterator.next();

        if (this.currentPatchSticker instanceof PatchSticker && !(this.currentPatchSticker instanceof PatchLineSticker)) {
            if (window.tattoContext.shouldSkipColorPatchPhase()) {
                window.tattoContext.onCurrentStickerDone();
                return;
            }
            //@ts-ignore
            if (window.tattoContext.labelInk && window.tattoContext.isFirstShowTextInk) {
                //@ts-ignore
                window.tattoContext.enableTextColorEffect();
            }
        }

        if (this.currentPatchSticker) {
            this.currentPatchSticker.node.setSiblingIndex(this.patchs.length);
            this.currentPatchSticker.showPatch(() => {
                if (this.currentPatchSticker instanceof PatchLineSticker) {
                    this.currentPatchSticker.sprayDotComp.registerTouchEvent();
                    window.tattoContext.tattoLineMachineOpacity.opacity = 255;
                    window.tattoContext.tattoLineMachine.setPosition(this.currentPatchSticker.sprayDotComp.paths[0])
                } else {
                    this.currentPatchSticker.sprayComp.registerTouchEvent();
                    window.tattoContext.tattoMachineOpacity.opacity = 255;
                }
                window.tattoContext.onShowNextPatchDone(this.stickerIterator.getCurrentPosition() - 1);
            });
        } else {
            window.tattoContext.onCurrentStickerDone();
        }
    }

    hideCurrentPatch(onHideComplete: () => void) {
        if (this.currentPatchSticker) {
            let prevPath = this.currentPatchSticker;
            prevPath.hidePatch(onHideComplete);
        }
    }

    private showFinalImageOnly(): void {
        if (!this.finalImage) {
            console.error('TattooLineSticker: finalImage is not assigned.');
            return;
        }
        this.node.children.forEach((child) => {
            child.active = child === this.finalImage;
        });
        this.finalImage.active = true;
        this.finalImage.setSiblingIndex(this.node.children.length - 1);
    }

    onPrayComplete() {
        if (this.currentPatchSticker instanceof PatchLineSticker) {
            window.tattoContext.tattoLineMachineOpacity.opacity = 0;
            window.tattoContext.tattoLineMachine.setPosition(Vec3.ZERO);
            this.currentPatchSticker.sprayDotComp.unRegisterTouchEvent();
        } else {
            window.tattoContext.tattoMachineOpacity.opacity = 0;
            window.tattoContext.tattoMachine.setPosition(Vec3.ZERO);
            this.currentPatchSticker.sprayComp.unRegisterTouchEvent();
        }

        const currentSticker = this.stickerAggregate.collection[this.stickerIterator.getCurrentPosition() - 1];
        const nextSticker = this.stickerAggregate.collection[this.stickerIterator.getCurrentPosition()];
        if (!nextSticker) {
            this.hideCurrentPatch(() => { });
            this.showFinalImageOnly();
            window.tattoContext.onCurrentStickerDone();
            return;
        }

        this.hideCurrentPatch(() => {
            const isLastSticker = !nextSticker

            if ((nextSticker instanceof PatchSticker2 && currentSticker instanceof PatchLineSticker) || isLastSticker) {
                if (nextSticker instanceof PatchSticker2 && currentSticker instanceof PatchLineSticker) {
                    this.showFinalImageOnly();
                }
                window.tattoContext.showTextWow();
                setTimeout(() => {
                    this.showNextPatch();
                }, 2000);
            } else {
                this.showNextPatch();
            }
        });
    }

    onPrayNotComplete(posNotFill: Vec3) {
        // console.log('posNotFill ', posNotFill);
        // this.helpNode.setPosition(posNotFill);
    }
}
