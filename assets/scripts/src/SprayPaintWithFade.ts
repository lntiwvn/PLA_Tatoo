import {
    _decorator,
    Color,
    Component,
    EventTouch,
    Graphics,
    Node,
    UITransform,
    Vec3,
    CCFloat,
    Sprite,
    gfx,
    Rect,
    director,
    Vec2,
} from 'cc';
import { Constant } from '../../constant/constant';
import { IsContext } from './Utils';
const { ccclass, property } = _decorator;

@ccclass('SprayPaintWithFade')
export class SprayPaintWithFade extends Component {
    @property
    drawSpeed = 160;
    @property(Graphics)
    graphics: Graphics = null;
    @property(CCFloat)
    sparyRadius = 40;
    @property(Node)
    maskNode: Node = null;

    lastDrawTime: number = 0;
    isCanPray: boolean;
    sprayColor: Color;
    imageData: ImageData;
    filledBuffer: Uint8Array;
    maskBufffer: Uint8Array;

    lastMousePosition: Vec3 = new Vec3();
    allCirclesPos: Vec3[] = [];

    maskTotalPixel: number = 0;

    isTouchDown: boolean = false;
    isComplete: boolean = false;
    patchCompleted: boolean = false;
    autoDrawing = false;
    autoDrawIndex = 0;

    isFirstMove: boolean = true;

    protected onLoad(): void {
        this.filledBuffer = new Uint8Array(512 * 512 * 4);
        for (let i = 0; i < this.filledBuffer.length; i += 4) {
            this.filledBuffer[i] = 255; // Red
            this.filledBuffer[i + 1] = 255; // Green
            this.filledBuffer[i + 2] = 255; // Blue
            this.filledBuffer[i + 3] = 0; // Alpha
        }
    }

    start() {
        this.maskBufffer = this.getPixels(this.maskNode.getComponent(Sprite));
        this.lastMousePosition.set(0, 0, 0);

        for (let i = 0; i < 512 * 512 * 4; i += 4) {
            const maskAlpha = this.maskBufffer[i + 3];
            if (maskAlpha > 0) {
                this.maskTotalPixel++;
            }
        }
    }

    registerTouchEvent() {
        this.isComplete = false;
        this.patchCompleted = false;
        this.autoDrawing = false;
        this.autoDrawIndex = 0;
        window.tattoContext.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        window.tattoContext.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        window.tattoContext.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        window.tattoContext.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    unRegisterTouchEvent() {
        this.isComplete = false;
        window.tattoContext.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        window.tattoContext.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        window.tattoContext.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        window.tattoContext.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    getPixels(sp: Sprite, rect?: Rect) {
        let width = sp.getComponent(UITransform).width;
        let height = sp.getComponent(UITransform).height;
        const gfxTexture = sp.spriteFrame.getGFXTexture();
        if (!gfxTexture) {
            return null;
        }
        const bufferViews: ArrayBufferView[] = [];
        const regions: gfx.BufferTextureCopy[] = [];

        const region0 = new gfx.BufferTextureCopy();
        region0.texOffset.x = rect?.x || 0;
        region0.texOffset.y = rect?.y || 0;
        region0.texExtent.width = width;
        region0.texExtent.height = height;
        regions.push(region0);
        const buffer = new Uint8Array(width * height * 4);
        bufferViews.push(buffer);
        director.root?.device.copyTextureToBuffers(gfxTexture, bufferViews, regions);
        return buffer;
    }

    createImageData(width: number, height: number): ImageData {
        // Tạo ImageData với kích thước width x height
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        const imageData = context.createImageData(width, height);

        // Khởi tạo ImageData với màu trắng (hoặc màu khác nếu cần)
        for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] = 255; // Red
            imageData.data[i + 1] = 255; // Green
            imageData.data[i + 2] = 255; // Blue
            imageData.data[i + 3] = 0; // Alpha
        }

        return imageData;
    }

    drawCircle(x: number, y: number, radius: number, color: Color) {
        const r = color.r;
        const g = color.g;
        const b = color.b;
        const a = color.a;

        for (let i = 0; i < 512; i++) {
            for (let j = 0; j < 512; j++) {
                const dx = i - x;
                const dy = j - y;
                if (dx * dx + dy * dy <= radius * radius) {
                    const index = (j * 512 + i) * 4;
                    this.filledBuffer[index] = r;
                    this.filledBuffer[index + 1] = g;
                    this.filledBuffer[index + 2] = b;
                    this.filledBuffer[index + 3] = a;
                }
            }
        }
    }

    onTouchStart(event: EventTouch) {
        if (!this.isCanPray || this.patchCompleted) {
            return;
        }

        this.patchCompleted = true;
        this.autoDrawing = true;

        //@ts-ignore
        if (window.tattoContext.labelInk) {
            //@ts-ignore
            window.tattoContext.stopTextColorEffect();
        }

        window.tattoContext.audioManager.stopAll();
        window.tattoContext.audioManager.playMusic(Constant.EFFECT_NAME.TATTOO_MACHINE_LINE, true);

        let { x, y } = event.getUILocation();
        // const currentMousePosition = new Vec3(event.getDeltaX(), event.getDeltaY(), 0);
        // let newPos = new Vec3(currentMousePosition.x + x, currentMousePosition.y + y + 50);
        let newPos = new Vec3(x, y + 24);
        let converToLocal = window.tattoContext.node.getComponent(UITransform).convertToNodeSpaceAR(newPos);
        window.tattoContext.setTattooMachinePos(converToLocal);

        this.schedule(this.autoDraw, 0.01);
    }

    onTouchMove(event: EventTouch) {
        if (!this.isCanPray || this.patchCompleted) {
            return;
        }

        if (IsContext('TattoContext_3<TatooContext3>') && this.isFirstMove) {
            this.isFirstMove = false;
            switch (window.tattoContext.currentSticker.stickerIterator.getCurrentPosition()) {
                case 1:
                    window.tattoContext.trackingManager.trackEvent('pl43_game_start');
                    break;
                case 2:
                    window.tattoContext.trackingManager.trackEvent('pl43_game_step_2_play');
                    break;
                case 3:
                    window.tattoContext.trackingManager.trackEvent('pl43_game_step_3_play');
                    break;
                case 4:
                    window.tattoContext.trackingManager.trackEvent('pl43_game_step_4_play');
                    break;
            }
        }

        // Lấy vị trí hiện tại của chuột
        const currentMousePosition = new Vec3(event.getDeltaX(), event.getDeltaY(), 0);

        // Tính toán sự thay đổi vị trí chuột
        const delta = currentMousePosition.clone();

        // let { x, y } = window.tattoContext.tattoMachine.getPosition();
        let { x, y } = event.getUILocation();
        let newPos = window.tattoContext.node.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(x, y + 50));

        // console.log('a', Vec3.distance(this.lastMousePosition, newPos));
        let distance = Vec3.distance(this.lastMousePosition, newPos);
        if (distance >= 2.5) {
            // this.graphics.lineTo(newPos.x, newPos.y)
            // this.graphics.stroke();
            this.fillCircle(newPos)
            this.lastMousePosition = newPos;
            // console.log('distance', distance);
        }

        window.tattoContext.setTattooMachinePos(newPos);

        let { width, height } = this.maskNode.getComponent(UITransform);
        let { isMaskFullyCovered } = this.checkMaskFullyCovered(this.maskBufffer, this.filledBuffer, width, height);

        if (!this.isComplete && isMaskFullyCovered) {
            this.onTouchEnd((window.tattoContext.name === 'TattoContext_3<TatooContext3>'));
        }
    }

    autoDraw() {
        if (!this.autoDrawing || !this.isCanPray || !this.maskNode) {
            return;
        }
        const width = this.maskNode.getComponent(UITransform).width;
        const height = this.maskNode.getComponent(UITransform).height;
        const step = Math.max(1, this.drawSpeed * 0.01);
        const total = Math.ceil(width * height / step);
        const index = this.autoDrawIndex++ % total;
        const x = (index * step) % width - width / 2;
        const y = height / 2 - Math.floor((index * step) / width) - 1;
        this.fillCircle(new Vec3(x, y));
        const covered = this.checkMaskFullyCovered(this.maskBufffer, this.filledBuffer, width, height).isMaskFullyCovered;
        if (covered) {
            this.autoDrawing = false;
            this.isComplete = true;
            this.unschedule(this.autoDraw);
            this.unRegisterTouchEvent();
            window.tattoContext.currentSticker.onPrayComplete();
        }
    }

    fillCircle(pos: Vec3) {
        this.graphics.fillColor = this.sprayColor;
        this.graphics.circle(pos.x, pos.y, this.sparyRadius);
        this.graphics.fill();
        this.allCirclesPos.push(pos);

        let xCanvas = pos.x + 512 / 2;
        let yCanvas = 512 / 2 - pos.y;
        this.drawCircle(xCanvas, yCanvas, this.sparyRadius, this.sprayColor);
    }

    onTouchEnd(isStopMusic: boolean = true) {
        if (this.isComplete || this.patchCompleted) {
            return;
        }

        if (isStopMusic) {
            window.tattoContext.audioManager.stopAll();
        }

        // console.log('stop music');


        let { width, height } = this.maskNode.getComponent(UITransform);
        let { isMaskFullyCovered } = this.checkMaskFullyCovered(this.maskBufffer, this.filledBuffer, width, height);
        if (isMaskFullyCovered) {
            this.isComplete = true;
            // console.log('isPrayFull true');
            this.graphics.circle(0, 0, 512);
            this.graphics.fill();
            window.tattoContext.currentSticker.onPrayComplete();
        }
    }

    checkMaskFullyCovered(maskBuffer: Uint8Array, canvasBuffer: Uint8Array, width: number, height: number) {
        let totalMatched = 0;

        for (let i = 0; i < width * height * 4; i += 4) {
            const maskA = maskBuffer[i + 3];
            if (maskA > 0) {
                const canvasA = canvasBuffer[i + 3];
                if (canvasA > 0) {
                    totalMatched++;
                }
            }
        }
        let percentFill = (totalMatched / this.maskTotalPixel) * 100;
        // console.log('percent Fill', percentFill);

        return {
            isMaskFullyCovered: percentFill >= 90,
        };
    }
}
