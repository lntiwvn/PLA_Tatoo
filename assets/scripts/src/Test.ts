import { _decorator, Color, Component, Graphics, Node, Sprite } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Test')
export class Test extends Component {
    @property(Graphics)
    testGraphics: Graphics = null;
    @property(Sprite)
    spriteTest: Sprite = null;

    start() {
        // console.log(this.spriteTest.material);

        this.testGraphics.fillColor = new Color(255, 0, 0, 255)
        this.testGraphics.circle(0, 0, 100);
        this.testGraphics.fill();
        setTimeout(() => {
            // console.log('aaa');

            this.testGraphics.color = new Color(0, 0, 255, 255);
        }, 2000);
    }

    update(deltaTime: number) {

    }
}


