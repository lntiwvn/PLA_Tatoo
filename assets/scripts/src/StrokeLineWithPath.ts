import { _decorator, Color, Component, EventTouch, Graphics, Node, Vec3 } from 'cc';
import { Constant } from '../../constant/constant';
import { TatooContext1 } from './context/TattooContext1';
import gameEndHandler from '../../PLAGameFoundation/gameControl/utilities/handler/gameEndHandler';
const { ccclass, property } = _decorator;

@ccclass('StrokeLineWithPath')
export class StrokeLineWithPath extends Component {
    @property(Graphics)
    graphics: Graphics = null;

    pathsLine: Node[] = [];

    lastMousePosition: Vec3 = new Vec3();
    isCanDraw: boolean = false;

    isMoving = false;
    currentPathIndex = 0;
    moveSpeed = 400; // Tốc độ di chuyển
    paths: Vec3[] = [];
    sprayColor: Color;

    lastPost: Vec3 = new Vec3();

    onLoad() {
        this.pathsLine = [];
        this.pathsLine = this.node.children;
        this.setPaths(this.pathsLine)
    }

    registerTouchEvent() {
        window.tattoContext.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        window.tattoContext.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        window.tattoContext.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    unRegisterTouchEvent() {
        window.tattoContext.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        window.tattoContext.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        window.tattoContext.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    setPaths(paths: Node[]) {
        this.paths = paths.map((node) => node.getPosition());
    }

    drawLine() {
        //@ts-ignore
        if (window.tattoContext.labelInk) {
            //@ts-ignore
            window.tattoContext.stopTextInkEffect();
        }


        if (this.isMoving && this.paths.length > 0 && this.isCanDraw) {
            let target = this.paths[this.currentPathIndex];

            let { x: lineMachineX, y: lineMachineY } = window.tattoContext.tattoLineMachine.position;
            let { x: targetX, y: targetY } = target;
            let direction = new Vec3(targetX - lineMachineX, targetY - lineMachineY).normalize();
            let distance = Vec3.distance(window.tattoContext.tattoLineMachine.position, target);
            if (distance > this.moveSpeed * 0.01) {
                let newPos = new Vec3(window.tattoContext.tattoLineMachine.position.x, window.tattoContext.tattoLineMachine.position.y).add(
                    direction.multiply(new Vec3(this.moveSpeed * 0.01, this.moveSpeed * 0.01, this.moveSpeed * 0.01))
                );
                window.tattoContext.setTattooLineMachinePos(newPos);

                // console.log('Vec3.distance(this.lastPost, newPos)', Vec3.distance(this.lastPost, newPos));


                if (Vec3.distance(this.lastPost, newPos) >= 0.5) {
                    this.drawLineGraphic(newPos);
                    this.lastPost = newPos;
                }

            } else {
                window.tattoContext.setTattooLineMachinePos(target);
                this.drawLineGraphic(target);
                this.currentPathIndex++;
                if (this.currentPathIndex >= this.paths.length) {
                    this.isMoving = false;
                }
            }
        }
    }

    onTouchStart(event: EventTouch) {
        // console.log('touch down', this.isCanDraw);
        const context = window.tattoContext as TatooContext1;

        if (context.isFirstStickerDone) {
            context.isFirstStickerDone = false;
            gameEndHandler.StoreGameChangingNoCondition();
        }

        if (!this.isCanDraw) {
            return;
        }

        if (this.currentPathIndex >= this.paths.length) {
            return;
        }

        if (this.currentPathIndex === 0) {
            this.graphics.moveTo(this.paths[0].x, this.paths[0].y);
            window.tattoContext.tattoLineMachine.setPosition(this.paths[0]);
            this.currentPathIndex++;
        }

        window.tattoContext.audioManager.playMusic(Constant.EFFECT_NAME.TATTOO_MACHINE_LINE, true);

        this.schedule(this.drawLine, 0.01);
        this.isMoving = true;
    }

    onTouchEnd(event: EventTouch) {
        window.tattoContext.audioManager.stopAll();
        this.isMoving = false;
        this.unschedule(this.drawLine);

        if (this.currentPathIndex >= this.paths.length) {
            window.tattoContext.currentSticker.onPrayComplete();
        }
    }

    drawLineGraphic(target: Vec3) {
        this.graphics.circle(target.x, target.y, 5);
        this.graphics.fill();
    }
}
