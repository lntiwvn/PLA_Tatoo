import { _decorator, Color, Component, EventTouch, Graphics, Node, Vec3 } from 'cc';
import { Constant } from '../../constant/constant';
import { SuperHtml } from '../utils/SuperHtml';
import { TatooContext1 } from './context/TattooContext1';
const { ccclass, property } = _decorator;

@ccclass('StrokeLineWithPath')
export class StrokeLineWithPath extends Component {
    @property
    drawSpeed = 400;
    @property(Graphics)
    graphics: Graphics = null;

    pathsLine: Node[] = [];

    lastMousePosition: Vec3 = new Vec3();
    isCanDraw: boolean = false;

    isMoving = false;
    patchCompleted = false;
    currentPathIndex = 0;
    moveSpeed = 400; // Tốc độ di chuyển
    paths: Vec3[] = [];
    sprayColor: Color;

    lastPost: Vec3 = new Vec3();

    // Khi vẽ nhiều phần cùng lúc: chỉ phần leader mới điều khiển máy xăm,
    // âm thanh và text hướng dẫn. Các phần còn lại tự vẽ bằng con trỏ riêng.
    isLeader: boolean = true;
    onDrawStarted: () => void = null;
    onDrawComplete: () => void = null;

    private cursor: Vec3 = new Vec3();

    onLoad() {
        this.pathsLine = [];
        this.pathsLine = this.node.children;
        this.setPaths(this.pathsLine)
    }

    registerTouchEvent() {
        this.patchCompleted = false;
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

    /** Bắt đầu vẽ mà không cần chạm - dùng cho các phần chạy kèm trong cùng một lượt. */
    startAutoDraw() {
        if (this.patchCompleted || !this.isCanDraw) {
            return;
        }

        this.patchCompleted = true;
        this.moveSpeed = this.drawSpeed;
        this.beginPath();
        this.schedule(this.drawLine, 0.01);
        this.isMoving = true;
    }

    private beginPath() {
        if (this.currentPathIndex === 0 && this.paths.length > 0) {
            this.graphics.moveTo(this.paths[0].x, this.paths[0].y);
            this.setCursor(this.paths[0]);
            this.currentPathIndex = 1;
        }
    }

    private setCursor(pos: Vec3) {
        this.cursor.set(pos);
        if (this.isLeader) {
            window.tattoContext.setTattooLineMachinePos(pos, this.node);
        }
    }

    private notifyDrawComplete() {
        if (this.onDrawComplete) {
            this.onDrawComplete();
            return;
        }
        window.tattoContext.currentSticker.onPrayComplete();
    }

    drawLine() {
        //@ts-ignore
        if (this.isLeader && window.tattoContext.labelInk) {
            //@ts-ignore
            window.tattoContext.stopTextInkEffect();
        }


        if (this.isMoving && this.paths.length > 0 && this.isCanDraw) {
            let target = this.paths[this.currentPathIndex];

            let { x: lineMachineX, y: lineMachineY } = this.cursor;
            let { x: targetX, y: targetY } = target;
            let direction = new Vec3(targetX - lineMachineX, targetY - lineMachineY).normalize();
            let distance = Vec3.distance(this.cursor, target);
            if (distance > this.moveSpeed * 0.01) {
                let newPos = new Vec3(this.cursor.x, this.cursor.y).add(
                    direction.multiply(new Vec3(this.moveSpeed * 0.01, this.moveSpeed * 0.01, this.moveSpeed * 0.01))
                );
                this.setCursor(newPos);

                // console.log('Vec3.distance(this.lastPost, newPos)', Vec3.distance(this.lastPost, newPos));


                if (Vec3.distance(this.lastPost, newPos) >= 0.5) {
                    this.drawLineGraphic(newPos);
                    this.lastPost = newPos;
                }

            } else {
                this.setCursor(target);
                this.drawLineGraphic(target);
                this.currentPathIndex++;
                if (this.currentPathIndex >= this.paths.length) {
                    this.isMoving = false;
                    this.unschedule(this.drawLine);
                    this.unRegisterTouchEvent();
                    if (this.isLeader) {
                        window.tattoContext.audioManager.stopAll();
                    }
                    this.notifyDrawComplete();
                }
            }
        }
    }

    onTouchStart(event: EventTouch) {
        // console.log('touch down', this.isCanDraw);
        if (!this.isCanDraw || this.patchCompleted) {
            return;
        }

        const context = window.tattoContext as TatooContext1;

        if (context.isFirstStickerDone) {
            context.isFirstStickerDone = false;
            SuperHtml.instance?.actDownload();
        }

        this.patchCompleted = true;

        this.moveSpeed = this.drawSpeed;
        window.tattoContext.audioManager.playMusic(Constant.EFFECT_NAME.TATTOO_MACHINE_LINE, true);
        this.beginPath();
        this.schedule(this.drawLine, 0.01);
        this.isMoving = true;

        this.onDrawStarted && this.onDrawStarted();
    }

    onTouchEnd(event: EventTouch) {
        if (this.patchCompleted) {
            return;
        }
        window.tattoContext.audioManager.stopAll();
        this.isMoving = false;
        this.unschedule(this.drawLine);

        if (this.currentPathIndex >= this.paths.length) {
            this.notifyDrawComplete();
        }
    }

    drawLineGraphic(target: Vec3) {
        this.graphics.circle(target.x, target.y, 5);
        this.graphics.fill();
    }
}
