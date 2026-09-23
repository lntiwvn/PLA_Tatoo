import { _decorator, CCFloat, Color, Component, Graphics, Node, Vec3 } from 'cc';
import { StrokeLineWithPath } from './StrokeLineWithPath';
import { IPatchDrawComp, PatchSticker } from './PatchSticker';
const { ccclass, property } = _decorator;

@ccclass('PatchLineSticker')
export class PatchLineSticker extends PatchSticker {
    @property(StrokeLineWithPath)
    sprayDotComp: StrokeLineWithPath = null;

    @property(Color)
    lineColor: Color = new Color(255, 255, 255);

    @property(Node)
    lineNode: Node = null;

    @property(Graphics)
    lineNodeGraphic: Graphics = null;

    @property(StrokeLineWithPath)
    strokeLinePathNode: StrokeLineWithPath = null;

    @property(CCFloat)
    private orderDraw: number = 0;

    init() {
        this.sprayDotComp.sprayColor = this.lineColor;

        let paths = this.strokeLinePathNode.pathsLine.map((node) => node.getPosition());


        for (let i = 0; i < paths.length; i++) {
            if (i % 2 === 0) {
                this.lineNodeGraphic.moveTo(paths[i].x, paths[i].y);
            } else {
                this.lineNodeGraphic.lineTo(paths[i].x, paths[i].y);
                this.lineNodeGraphic.stroke();
            }
        }

        if (this.lineNode) {
            this.lineNode.active = false;
        }
    }

    showPatch(onPatchShowDone: () => void) {
        if (this.lineNode) {
            this.lineNode.active = true;
        }

        // this.patchNode.active = true;
        onPatchShowDone && onPatchShowDone();
        this.setCanSpray(true);
    }

    hidePatch(onHideComplete: () => void) {
        if (this.lineNode) {
            this.lineNode.active = false;
        }

        this.setCanSpray(false);
        onHideComplete && onHideComplete();
    }

    setCanSpray(value: boolean) {
        this.sprayDotComp.isCanDraw = value;
    }

    get drawComp(): IPatchDrawComp {
        return this.sprayDotComp;
    }

}


