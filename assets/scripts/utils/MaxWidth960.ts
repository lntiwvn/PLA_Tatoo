import { _decorator, Canvas, Component, UITransform, Widget } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MaxWidth960')
export class MaxWidth960 extends Component {
    @property({ tooltip: 'Maximum UI width for this node. Keep 960 for wide layouts, lower it for portrait panels.' })
    maxWidth = 960;

    @property({ tooltip: 'Do not cap a Canvas node. Use this component on a UI container under Canvas instead.' })
    ignoreCanvasNode = true;

    @property
    isAlignLeft = false;

    @property
    isAlignRight = false;

    @property
    isAlignTop = false;

    @property
    isAlignBottom = false;

    @property
    isAlignHorizontalCenter = false;

    @property
    isAlignVerticalCenter = false;

    protected onLoad(): void {
        this.applyMaxWidth();
    }

    protected start(): void {
        this.applyMaxWidth();
    }

    private applyMaxWidth(): void {
        if (this.ignoreCanvasNode && this.node.getComponent(Canvas)) return;

        const transform = this.node.getComponent(UITransform);
        if (!transform) return;

        const maxWidth = Math.max(1, this.maxWidth);
        transform.setContentSize(Math.min(transform.width, maxWidth), transform.height);

        const widget = this.node.getComponent(Widget);
        if (widget) {
            widget.enabled = false;
            widget.isAlignLeft = this.isAlignLeft;
            widget.isAlignRight = this.isAlignRight;
            widget.isAlignTop = this.isAlignTop;
            widget.isAlignBottom = this.isAlignBottom;
            widget.isAlignHorizontalCenter = this.isAlignHorizontalCenter;
            widget.isAlignVerticalCenter = this.isAlignVerticalCenter;
            widget.enabled = true;
            widget.updateAlignment();
        }

        for (const child of this.node.children) {
            const childWidget = child.getComponent(Widget);
            if (!childWidget) continue;
            childWidget.enabled = true;
            childWidget.updateAlignment();
        }
    }
}