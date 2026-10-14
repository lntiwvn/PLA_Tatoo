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
    @property({ type: CCFloat, tooltip: 'Khoảng cách tối đa giữa các dấu tô màu, theo tọa độ local của nét vẽ.' })
    strokeSpacing = 4;
    @property({ type: CCFloat, min: 1, max: 100, tooltip: 'Phần trăm vùng mask cần tô để hoàn thành patch khi người chơi nhấc tay.' })
    completionPercent = 95;
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

    // Khi vẽ nhiều phần cùng lúc: chỉ phần leader mới điều khiển máy xăm,
    // âm thanh và text hướng dẫn. Các phần còn lại tự tô không cần chạm.
    isLeader: boolean = true;
    onDrawStarted: () => void = null;
    onDrawComplete: () => void = null;
    private maskWidth = 0;
    private maskHeight = 0;
    private hasStrokePoint = false;

    protected onLoad(): void {
        this.prepareMask();
    }

    start() {
        this.lastMousePosition.set(0, 0, 0);
        this.prepareMask();
    }

    private prepareMask(): boolean {
        if (this.maskBufffer) return this.maskTotalPixel > 0;
        const sprite = this.maskNode?.getComponent(Sprite);
        if (!sprite?.spriteFrame) return false;
        this.maskWidth = Math.round(sprite.spriteFrame.rect.width);
        this.maskHeight = Math.round(sprite.spriteFrame.rect.height);
        this.maskBufffer = this.getPixels(sprite);
        if (!this.maskBufffer) return false;
        this.filledBuffer = new Uint8Array(this.maskWidth * this.maskHeight * 4);
        this.maskTotalPixel = 0;
        for (let i = 0; i < this.maskBufffer.length; i += 4) {
            const maskAlpha = this.maskBufffer[i + 3];
            if (maskAlpha > 0) {
                this.maskTotalPixel++;
            }
        }
        return this.maskTotalPixel > 0;
    }

    registerTouchEvent() {
        this.prepareMask();
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
        this.isTouchDown = false;
        window.tattoContext.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        window.tattoContext.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        window.tattoContext.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        window.tattoContext.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    /** Bắt đầu tô mà không cần chạm - dùng cho các phần chạy kèm trong cùng một lượt. */
    startAutoDraw() {
        if (this.patchCompleted || !this.isCanPray || !this.prepareMask()) {
            return;
        }

        this.isComplete = false;
        this.patchCompleted = true;
        this.autoDrawing = true;
        this.autoDrawIndex = 0;
        this.schedule(this.autoDraw, 0.01);
    }

    private notifyDrawComplete() {
        if (this.onDrawComplete) {
            this.onDrawComplete();
            return;
        }
        window.tattoContext.currentSticker.onPrayComplete();
    }

    getPixels(sp: Sprite, rect?: Rect) {
        const frameRect = rect || sp.spriteFrame.rect;
        const width = Math.round(frameRect.width);
        const height = Math.round(frameRect.height);
        const gfxTexture = sp.spriteFrame.getGFXTexture();
        if (!gfxTexture || !director.root?.device) {
            return null;
        }
        const bufferViews: ArrayBufferView[] = [];
        const regions: gfx.BufferTextureCopy[] = [];

        const region0 = new gfx.BufferTextureCopy();
        region0.texOffset.x = frameRect.x;
        region0.texOffset.y = frameRect.y;
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

    drawCircle(x: number, y: number, radius: number, color: Color, radiusY = radius) {
        const r = color.r;
        const g = color.g;
        const b = color.b;
        const a = color.a;

        for (let i = Math.max(0, Math.floor(x - radius)); i < Math.min(this.maskWidth, Math.ceil(x + radius)); i++) {
            for (let j = Math.max(0, Math.floor(y - radiusY)); j < Math.min(this.maskHeight, Math.ceil(y + radiusY)); j++) {
                const dx = i - x;
                const dy = j - y;
                if (dx * dx / (radius * radius) + dy * dy / (radiusY * radiusY) <= 1) {
                    const index = (j * this.maskWidth + i) * 4;
                    this.filledBuffer[index] = r;
                    this.filledBuffer[index + 1] = g;
                    this.filledBuffer[index + 2] = b;
                    this.filledBuffer[index + 3] = a;
                }
            }
        }
    }

    onTouchStart(event: EventTouch) {
        if (!this.isCanPray || this.patchCompleted || !this.prepareMask()) {
            return;
        }

        this.isTouchDown = true;
        this.hasStrokePoint = false;

        //@ts-ignore
        if (this.isLeader && window.tattoContext.labelInk) {
            //@ts-ignore
            window.tattoContext.stopTextColorEffect();
        }

        if (this.isLeader) {
            window.tattoContext.audioManager.stopAll();
            window.tattoContext.audioManager.playMusic(Constant.EFFECT_NAME.TATTOO_MACHINE_LINE, true);

        }

        this.onDrawStarted && this.onDrawStarted();
        this.onTouchMove(event);
    }

    onTouchMove(event: EventTouch) {
        if (!this.isCanPray || this.patchCompleted || !this.isTouchDown) {
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

        const { x, y } = event.getUILocation();
        const newPos = window.tattoContext.node.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(x, y));
        const drawPos = window.tattoContext.convertPositionBetweenNodes(
            newPos,
            window.tattoContext.node,
            this.graphics.node,
        );

        const distance = Vec3.distance(this.lastMousePosition, drawPos);
        if (!this.hasStrokePoint) {
            this.fillCircle(drawPos);
            this.hasStrokePoint = true;
            this.lastMousePosition.set(drawPos);
        } else if (distance > 0.001) {
            const spacing = Math.max(0.5, Math.min(this.strokeSpacing, this.sparyRadius * 0.2));
            const steps = Math.ceil(distance / spacing);
            for (let i = 1; i <= steps; i++) {
                const point = new Vec3();
                Vec3.lerp(point, this.lastMousePosition, drawPos, i / steps);
                this.fillCircle(point);
            }
            this.lastMousePosition.set(drawPos);
        }

        if (this.isLeader) {
            window.tattoContext.setTattooMachinePos(newPos, window.tattoContext.node);
        }

        // Manual painting completes only when the player releases the touch.
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
        const covered = this.checkMaskFullyCovered(this.maskBufffer, this.filledBuffer, this.maskWidth, this.maskHeight).isMaskFullyCovered;
        if (covered) {
            this.autoDrawing = false;
            this.isComplete = true;
            this.unschedule(this.autoDraw);
            this.unRegisterTouchEvent();
            this.notifyDrawComplete();
        }
    }

    fillCircle(pos: Vec3) {
        this.graphics.fillColor = this.sprayColor;
        this.graphics.circle(pos.x, pos.y, this.sparyRadius);
        this.graphics.fill();
        this.allCirclesPos.push(pos);

        const maskPos = window.tattoContext.convertPositionBetweenNodes(pos, this.graphics.node, this.maskNode);
        const transform = this.maskNode.getComponent(UITransform);
        const sprite = this.maskNode.getComponent(Sprite);
        const frame = sprite.spriteFrame;
        // With Trim disabled, the frame occupies its original image size.
        // The coverage buffer contains only the trimmed rect read by getPixels.
        const sourceWidth = sprite.trim ? this.maskWidth : frame.originalSize.width;
        const sourceHeight = sprite.trim ? this.maskHeight : frame.originalSize.height;
        const trimLeft = sprite.trim ? 0 : frame.trimmedBorder.x;
        const trimTop = sprite.trim ? 0 : -frame.trimmedBorder.w;
        const scaleX = sourceWidth / transform.width;
        const scaleY = sourceHeight / transform.height;
        const xCanvas = (maskPos.x + transform.width * transform.anchorX) * scaleX - trimLeft;
        const yCanvas = (transform.height * (1 - transform.anchorY) - maskPos.y) * scaleY - trimTop;
        this.drawCircle(xCanvas, yCanvas, this.sparyRadius * scaleX, this.sprayColor, this.sparyRadius * scaleY);
    }

    onTouchEnd(isStopMusic: boolean = true) {
        this.isTouchDown = false;
        if (this.isComplete || this.patchCompleted) {
            return;
        }

        if (isStopMusic && this.isLeader) {
            window.tattoContext.audioManager.stopAll();
        }

        // console.log('stop music');


        const width = this.maskWidth;
        const height = this.maskHeight;
        let { isMaskFullyCovered } = this.checkMaskFullyCovered(this.maskBufffer, this.filledBuffer, width, height);
        if (isMaskFullyCovered) {
            this.isComplete = true;
            this.patchCompleted = true;
            // Keep the exact strokes and colors already painted by the player.
            this.notifyDrawComplete();
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
        let percentFill = this.maskTotalPixel > 0 ? (totalMatched / this.maskTotalPixel) * 100 : 0;
        // console.log('percent Fill', percentFill);

        return {
            percentFill,
            isMaskFullyCovered: percentFill >= Math.max(1, Math.min(100, this.completionPercent)),
        };
    }

    onDestroy() {
        this.unschedule(this.autoDraw);
        this.unRegisterTouchEvent();
    }
}
