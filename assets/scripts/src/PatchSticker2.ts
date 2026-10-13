import { _decorator, CCFloat, Color, GradientRange, UIOpacity } from 'cc';
import { PatchSticker } from './PatchSticker';
const { ccclass, property } = _decorator;

@ccclass('PatchSticker2')
export class PatchSticker2 extends PatchSticker {
    @property(UIOpacity)
    private overLayNodeOpacity: UIOpacity = null;
    @property(CCFloat)
    private orderDraw: number = 0;

    init() {
        this.sprayComp.sprayColor = this.sprayColor;
        this.dotsNodeOpacity = this.dotsNode.getComponent(UIOpacity);
        this.hideOverlay();
    }

    showPatch(onPatchShowDone: () => void) {
        this.showGuide();
        let gradient = new GradientRange();
        gradient.color = this.sprayColor;
        window.tattoContext.drawVfxParticle.startColor = gradient;
        this.dotsNodeOpacity.opacity = 255;
        this.setCanSpray(true);
        onPatchShowDone && onPatchShowDone();
    }

    hidePatch(onHideComplete: () => void) {
        this.setCanSpray(false);
        this.dotsNodeOpacity.opacity = 0;
        onHideComplete && onHideComplete();
    }

    showOverlay() {
        this.overLayNodeOpacity.opacity = 255;
    }

    hideOverlay() {
        this.overLayNodeOpacity.opacity = 0;
    }
}
