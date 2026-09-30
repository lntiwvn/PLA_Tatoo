import { _decorator, CCInteger, Component, Mask, Node, UITransform } from "cc";
const { ccclass, property } = _decorator;

@ccclass("RoundRectMask")
export class RoundRectMask extends Mask {
    @property({ type: CCInteger })
    private _roundRadius: number = 0;
    @property({ type: CCInteger })
    get roundRadius(): number {
        return this._roundRadius;
    }

    set roundRadius(radius: number) {
        this._roundRadius = radius;
        this._updateGraphics();
    }

    protected _updateGraphics() {
        if (
            !this._graphics ||
            (this._type !== Mask.Type.GRAPHICS_RECT &&
                this._type !== Mask.Type.GRAPHICS_ELLIPSE)
        ) {
            return;
        }

        const uiTransform = this.getComponent(UITransform);
        const { width, height, anchorX, anchorY } = uiTransform;

        const graphics = this._graphics;
        graphics.clear();
        const x = -width * anchorX;
        const y = -height * anchorY;
        graphics.roundRect(x, y, width, height, this.roundRadius || 10);
        graphics.fill();
    }
}