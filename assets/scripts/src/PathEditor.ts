import { _decorator, CCBoolean, Component, EventTouch, Graphics, Node, UITransform, Vec3 } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;
import { EDITOR } from 'cc/env';
// import { points } from './points';

@ccclass('PathEditor')
export class PathEditor extends Component {
    @property(Graphics)
    testGraphics: Graphics;

    start() {
        // this.testGraphics.moveTo(points[0][0] - 512 / 2, 512 / 2 - points[0][1]);
        // points.forEach((point, index) => {
        //     // if (index % 40 === 0) {
        //     //     let node = new Node(`point_[${point[0]}_${point[1]}]`);
        //     //     node.parent = this.node;
        //     //     node.position = new Vec3(point[0] - 512 / 2, 512 / 2 - point[1]);
        //     // }

        //     if (index > 0) {
        //         this.testGraphics.lineTo(point[0] - 512 / 2, 512 / 2 - point[1]);
        //     }
        // });

        // this.testGraphics.stroke();
    }
}
