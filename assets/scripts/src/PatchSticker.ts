import { _decorator, Color, Component, GradientRange, Material, MeshRenderer, Node, tween, UIOpacity } from 'cc';
import { SprayPaintWithFade } from './SprayPaintWithFade';
const { ccclass, property } = _decorator;

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

    init() {
        this.sprayComp.sprayColor = this.sprayColor;
        this.dotsNodeOpacity = this.dotsNode.getComponent(UIOpacity);
        this.patchNodeMaterial = this.patchNode.getComponent(MeshRenderer).material;
        this.dotsNodeOpacity.opacity = 0;

        this.patchNodeMaterial.setProperty('mainColor', new Color(255, 255, 255, 0));
        this.patchNodeMaterial.setProperty('angle', 120);
    }

    showPatch(onPatchShowDone: () => void) {
        let gradient = new GradientRange();
        gradient.color = this.sprayColor;
        window.tattoContext.drawVfxParticle.startColor = gradient;
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
}
