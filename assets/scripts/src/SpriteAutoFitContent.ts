import { _decorator, CCFloat, Component, Node, Size, Sprite, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SpriteAutoFitContent')
export class SpriteAutoFitContent extends Component {
    @property(CCFloat)
    aspectRatio: number = 1;

    protected start(): void {
        let { height } = this.node.getComponent(UITransform);
        this.node.getComponent(UITransform).setContentSize(new Size(height * this.aspectRatio, height));
    }
}
