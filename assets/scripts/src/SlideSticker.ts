import { _decorator, Component, Node, ScrollView, Size, UITransform, Vec2, Widget, Label, PageView, Sprite, tween, UIOpacity, Tween, director, Canvas, math } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SlideSticker')
export class SlideSticker extends Component {
    @property(ScrollView)
    slide: ScrollView = null;
    @property(Node)
    slideViewNode: Node = null;
    @property(Node)
    slideContentNode: Node = null;
    @property(Widget)
    parentNodeWidget: Widget = null;
    @property(Node)
    selectFrameNode: Node = null;

    @property(Node)
    nextBtnSprite: Node = null;

    @property(Node)
    prevBtnSprite: Node = null;

    currentSlideIndex: number = 0;
    totalItems: number = 0;
    visibleItems = 3;
    itemWidth: number = 0;
    itemMargin = 10;

    nextTween: Tween<UIOpacity>;
    prevTween: Tween<UIOpacity>;

    onScrollEnded: (currentIndex: number) => void;

    private mainCanvas: Canvas;

    protected onLoad(): void {
        this.mainCanvas = director.getScene().getChildByName('2D').getComponent(Canvas);
    }

    start() {
        console.log(this.mainCanvas.node.getChildByName('UI'));

        this.mainCanvas.node.getChildByName('UI').on(Node.EventType.SIZE_CHANGED, this.onCanvasChanged, this);
        this.calculateSize();
    }

    onCanvasChanged() {
        console.log('calculateSize');
        setTimeout(() => {
            this.calculateSize();
        }, 0);
    }

    calculateSize() {
        this.currentSlideIndex = 0;

        let { width: parentWidth } = this.mainCanvas.getComponent(UITransform);

        if (parentWidth > 670 + 25 * 2) {
            let offset = (parentWidth - 670) / 2;
            this.parentNodeWidget.left = offset;
            this.parentNodeWidget.right = offset;
        } else {
            this.parentNodeWidget.left = 25;
            this.parentNodeWidget.right = 25;

        }

        this.parentNodeWidget.updateAlignment();
        this.node.getComponentsInChildren(Widget).forEach((widget) => widget.updateAlignment());

        let { width, height } = this.slideViewNode.getComponent(UITransform);

        this.itemWidth = (width - 10 * 2) / 3;
        this.totalItems = this.slideContentNode.children.length;

        this.slideContentNode.children.forEach((item, index, childrens) => {
            item.getComponent(UITransform).setContentSize(new Size(this.itemWidth, height - 20));
        });

        this.selectFrameNode
            .getComponent(UITransform)
            .setContentSize(new Size((height - 14) * (239 / 280), height - 14));

        setTimeout(() => {
            this.node.getComponentsInChildren(Widget).forEach((widget) => widget.updateAlignment());
            this.slide.scrollToLeft();
        }, 0);

        this.slide.node.on(PageView.EventType.SCROLL_ENDED, () => {
            this.onScrollEnded && this.onScrollEnded(this.currentSlideIndex)
        }, this);

        this.enablEffect();
    }

    calculateOffset(index: number) {
        if (index < this.totalItems - 1) {
            // Nếu không phải là item cuối cùng, tính thêm margin
            return index * (this.itemWidth + 10);
        } else {
            // Item cuối cùng không có margin
            return index * this.itemWidth;
        }
    }

    onClickNext() {
        if (this.currentSlideIndex < this.totalItems - this.visibleItems) {
            this.currentSlideIndex += 1; // Tăng chỉ số item hiện tại
        } else {
            this.currentSlideIndex = 0; // Cuộn về item đầu tiên nếu đang ở item cuối cùng
        }
        let targetOffset = this.calculateOffset(this.currentSlideIndex); // Tính toán pixel offset
        this.slide.scrollToOffset(new Vec2(targetOffset, 0), 0.5);
        this.stopEffect();
    }

    onClickPrev() {
        if (this.currentSlideIndex > 0) {
            this.currentSlideIndex -= 1; // Giảm chỉ số item hiện tại
        } else {
            this.currentSlideIndex = this.totalItems - this.visibleItems; // Cuộn về item cuối cùng nếu đang ở item đầu tiên
        }
        let targetOffset = this.calculateOffset(this.currentSlideIndex); // Tính toán pixel offset
        this.slide.scrollToOffset(new Vec2(targetOffset, 0), 0.5);
        this.stopEffect();
    }

    enablEffect() {
        this.nextTween = this.blinkEffect(this.nextBtnSprite);
        this.prevTween = this.blinkEffect(this.prevBtnSprite);
    }

    blinkEffect(target: Node) {
        return tween(target.getComponent(UIOpacity))
            .to(0.5, { opacity: 180 })
            .to(0.5, { opacity: 255 })
            .union()
            .repeatForever()
            .start();
    }

    stopEffect() {
        this.nextTween.stop();
        this.prevTween.stop();

        this.nextBtnSprite.getComponent(UIOpacity).opacity = 255;
        this.prevBtnSprite.getComponent(UIOpacity).opacity = 255;
    }
}
