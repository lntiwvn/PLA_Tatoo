import { _decorator, CCFloat, Color, Component, GradientRange, Material, MeshRenderer, Node, Tween, tween, UIOpacity } from 'cc';
import { SprayPaintWithFade } from './SprayPaintWithFade';
const { ccclass, property } = _decorator;

/**
 * Giao diện chung cho các component vẽ của một patch (tô màu hoặc đi line).
 * TattooLineSticker dùng nó để điều phối nhiều patch vẽ cùng một lượt.
 */
export interface IPatchDrawComp {
    isLeader: boolean;
    onDrawStarted: () => void;
    onDrawComplete: () => void;
    registerTouchEvent(): void;
    unRegisterTouchEvent(): void;
    startAutoDraw(): void;
}

@ccclass('PatchSticker')
export class PatchSticker extends Component {
    @property(Node)
    dotsNode: Node = null;
    dotsNodeOpacity: UIOpacity;

    @property(Node)
    patchNode: Node = null;
    patchNodeMaterial: Material;

    @property(SprayPaintWithFade)
    sprayComp: SprayPaintWithFade = null;

    @property(Color)
    sprayColor: Color = new Color(255, 255, 255);

    @property(CCFloat)
    minOpacity = 80;
    @property(CCFloat)
    maxOpacity = 255;
    @property(CCFloat)
    flashDuration = 0.5;
    private flashTween: Tween<UIOpacity> = null;

    init() {
        this.sprayComp.sprayColor = this.sprayColor;
        this.dotsNodeOpacity = this.dotsNode.getComponent(UIOpacity);
        this.patchNodeMaterial = this.patchNode.getComponent(MeshRenderer).material;
        this.dotsNodeOpacity.opacity = 0;

        this.patchNodeMaterial.setProperty('mainColor', new Color(255, 255, 255, 0));
        this.patchNodeMaterial.setProperty('angle', 120);
    }

    showMachinePatch(): void {
        this.node.active = true;
        if (this.patchNode) this.patchNode.active = true;
        if (this.dotsNode) this.dotsNode.active = true;
        if (!this.dotsNodeOpacity) {
            console.error('PatchSticker: dotsNodeOpacity is missing. Assign dotsNode and UIOpacity.');
            return;
        }
        this.flashTween?.stop();
        const duration = Math.max(0.01, this.flashDuration);
        this.flashTween = tween(this.dotsNodeOpacity)
            .set({ opacity: this.minOpacity })
            .to(duration, { opacity: this.maxOpacity })
            .to(duration, { opacity: this.minOpacity })
            .union()
            .repeatForever()
            .start();
    }

    hideMachinePatch(): void {
        this.flashTween?.stop();
        this.flashTween = null;
        if (this.dotsNodeOpacity) this.dotsNodeOpacity.opacity = 0;
        if (this.patchNode) this.patchNode.active = false;
        if (this.dotsNode) this.dotsNode.active = false;
    }

    showPatch(onPatchShowDone: () => void) {
        if (window.tattoContext.drawVfxParticle) {
            const gradient = new GradientRange();
            gradient.color = this.sprayColor;
            window.tattoContext.drawVfxParticle.startColor = gradient;
        }
        this.patchNode.active = true;
        this.dotsNodeOpacity.opacity = 255;

        tween(new Number())
            .by(0.2, new Number(), {
                onUpdate: (target: Number, ratio: number) => {
                    this.patchNodeMaterial.setProperty('mainColor', new Color(255, 255, 255, 255 * ratio));
                },
            })
            .start();

        tween(new Number())
            .by(1, new Number(), {
                onUpdate: (target: Number, ratio: number) => {
                    this.patchNodeMaterial.setProperty('angle', 120 * (1 - ratio));
                    if (ratio >= 1) {
                        onPatchShowDone && onPatchShowDone();
                    }
                },
            })
            .call(() => {
                this.setCanSpray(true);
            })
            .start();
    }

    hidePatch(onHideComplete: () => void) {
        this.setCanSpray(false);
        this.dotsNodeOpacity.opacity = 0;
        tween(new Number())
            .by(2, new Number(), {
                onUpdate: (target: Number, ratio: number) => {
                    this.patchNodeMaterial.setProperty('angle', 120 * ratio);
                    if (ratio === 1) {
                        onHideComplete && onHideComplete();
                    }
                },
            })
            .call(() => {
                this.patchNode.active = false;
            })
            .start();
        tween(new Number())
            .delay(1)
            .by(0.2, new Number(), {
                onUpdate: (target: Number, ratio: number) => {
                    this.patchNodeMaterial.setProperty('mainColor', new Color(255, 255, 255, 255 * (1 - ratio)));
                },
            })
            .start();
    }

    setCanSpray(value: boolean) {
        this.sprayComp.isCanPray = value;
    }

    /**
     * Hiện nét đứt hướng dẫn của patch. Gọi được nhiều lần; dùng cho lượt tự
     * chạy để nét đứt kịp hiện trước khi bút vẽ tới.
     */
    showGuide(): void {
        this.node.active = true;
        if (this.dotsNode) this.dotsNode.active = true;
        if (this.dotsNodeOpacity) this.dotsNodeOpacity.opacity = 255;
    }

    get drawComp(): IPatchDrawComp {
        return this.sprayComp;
    }
}
