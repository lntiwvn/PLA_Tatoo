import { _decorator, CCString, Component, Vec3 } from 'cc';
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
            return null;
        });


        this.patchs.forEach((sticker) => {
            sticker.init();
        });

        this.stickerAggregate = new ConcreteAggregate<PatchSticker>();
        this.stickerAggregate.addItem(this.patchs);
        this.stickerIterator = this.stickerAggregate.createIterator();
    }

    showNextPatch() {
        this.currentPatchSticker = this.stickerIterator.next();

        if (this.currentPatchSticker instanceof PatchSticker2) {
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

        this.hideCurrentPatch(() => {
            const currentSticker = this.stickerAggregate.collection[this.stickerIterator.getCurrentPosition() - 1];
            const nextSticker = this.stickerAggregate.collection[this.stickerIterator.getCurrentPosition()];
            const isLastSticker = !nextSticker

            if ((nextSticker instanceof PatchSticker2 && currentSticker instanceof PatchLineSticker) || isLastSticker) {
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
