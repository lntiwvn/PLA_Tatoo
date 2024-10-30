import { _decorator, CCString, Component, Vec3 } from 'cc';
import { PatchSticker } from './PatchSticker';
import { ConcreteAggregate } from './Iterator/ConcreteAggregate';
import { Iterator } from './Iterator/Iterator';
import { IsContext } from './Utils';
const { ccclass, property } = _decorator;

@ccclass('TattooSticker')
export class TattooSticker extends Component {
    @property([PatchSticker])
    patchs: PatchSticker[] = [];

    stickerAggregate: ConcreteAggregate<PatchSticker>;
    stickerIterator: Iterator<PatchSticker>;
    currentPatchSticker: PatchSticker;

    init() {
        this.patchs.forEach((sticker) => {
            sticker.init();
        });

        this.stickerAggregate = new ConcreteAggregate<PatchSticker>();
        this.stickerAggregate.addItem(this.patchs);
        this.stickerIterator = this.stickerAggregate.createIterator();
    }

    showNextPatch() {
        this.currentPatchSticker = this.stickerIterator.next();
        if (this.currentPatchSticker) {
            this.currentPatchSticker.node.setSiblingIndex(3);
            this.currentPatchSticker.showPatch(() => {
                if (IsContext('TattoContext_3<TatooContext3>')) {
                    const patchNumber = this.stickerIterator.getCurrentPosition();
                    if (patchNumber === 2) {
                        window.tattoContext.trackingManager.trackEvent('pl43_game_step_2_loaded');
                    }
                }
                this.currentPatchSticker.sprayComp.registerTouchEvent();
                window.tattoContext.tattoMachineOpacity.opacity = 255;
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
        if (IsContext('TattoContext_3<TatooContext3>')) {
            const pathNumber = this.stickerIterator.getCurrentPosition();
            if (pathNumber === 1) {
                window.tattoContext.trackingManager.trackEvent('pl43_game_step_1_end');
            }
        }

        window.tattoContext.tattoMachineOpacity.opacity = 0;
        window.tattoContext.tattoMachine.setPosition(Vec3.ZERO);
        this.currentPatchSticker.sprayComp.unRegisterTouchEvent();

        this.hideCurrentPatch(() => {
            window.tattoContext.showTextWow();
            setTimeout(() => {
                this.showNextPatch();
            }, 2000);
        });
    }

    onPrayNotComplete(posNotFill: Vec3) {
        // console.log('posNotFill ', posNotFill);
        // this.helpNode.setPosition(posNotFill);
    }
}
