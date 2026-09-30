import {
    _decorator,
    CCBoolean,
    Color,
    Component,
    EventTouch,
    Graphics,
    instantiate,
    Node,
    Prefab,
    tween,
    UIOpacity,
    UITransform,
    Vec3,
} from 'cc';
import { Constant } from '../../constant/constant';
import { PatchSticker } from './PatchSticker';
import { PatchLineSticker } from './PatchLineSticker';
import { IsContext } from './Utils';
const { ccclass, property } = _decorator;
@ccclass('FoamContext')
export class FoamContext extends Component {
    @property(Node)
    spongeNode: Node = null;
    @property(UIOpacity)
    spongeUIOpacity: UIOpacity = null;

    @property(Prefab)
    foamItemPrefab: Prefab = null;
    @property(Node)
    foamMachine: Node = null;
    @property(UIOpacity)
    foamMachineUIOpacity: UIOpacity = null;

    @property(CCBoolean)
    isStartFillFoam: boolean;
    @property(CCBoolean)
    isStartClearFoam: boolean;

    @property(Node)
    cleanFoamNode: Node = null;
    @property(Graphics)
    cleanFoamGraphics: Graphics = null;

    lastMousePosition: Vec3 = new Vec3();
    lastFoamItem: Vec3 = new Vec3();

    lastDrawTime: number = 0;
    currentTime: number;

    foamBuffer: Uint8Array;

    spongeRadius: number = 0;
    allCirclesCleanPos: Vec3[] = [];

    timeEscape: number = 0;
    isHasPlayFoamLoop: boolean = false;
    isTouchDown: boolean = false;

    isFirstFillMove: boolean = true;
    isFirstClearMove: boolean = true;

    protected onLoad(): void {
        this.foamBuffer = new Uint8Array(512 * 512 * 4);
        this.resetFoamBuffer();
        this.spongeRadius = (this.spongeNode.getComponent(UITransform).width * 0.5) / 2;
    }

    resetFoamBuffer() {
        for (let i = 0; i < this.foamBuffer.length; i += 4) {
            this.foamBuffer[i] = 255; // Red
            this.foamBuffer[i + 1] = 255; // Green
            this.foamBuffer[i + 2] = 255; // Blue
            this.foamBuffer[i + 3] = 0; // Alpha
        }
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
                    this.foamBuffer[index] = r;
                    this.foamBuffer[index + 1] = g;
                    this.foamBuffer[index + 2] = b;
                    this.foamBuffer[index + 3] = a;
                }
            }
        }
    }

    // init() {
    //     this.registerTouchEvent();
    // }

    startFillFoam() {
        this.registerTouchEvent();
        this.resetFoamBuffer();
        this.showFoamMachine();
        this.hideSponge();
        this.isStartFillFoam = true;
        this.isStartClearFoam = false;
        this.foamMachine.setPosition(new Vec3(0, 0, 0));
    }

    startClearFoam() {
        this.registerTouchEvent();
        this.resetFoamBuffer();
        this.hideFoamMachine();
        this.showSponge();
        this.isStartClearFoam = true;
        this.isStartFillFoam = false;
        this.spongeNode.setPosition(new Vec3(0, 0, 0));
    }

    registerTouchEvent() {
        // console.log("registerTouchEvent");

        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    unRegisterTouchEvent() {
        // console.log("unRegisterTouchEvent");

        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    onTouchStart() {
        this.isTouchDown = true;
        if (this.isStartFillFoam) {
            window.tattoContext.audioManager.playMusic(Constant.EFFECT_NAME.FOAM_START, true);
        }

        if (this.isStartClearFoam) {
            window.tattoContext.audioManager.playMusic(Constant.EFFECT_NAME.CLEAR_FOAM, true);
        }
    }

    onTouchMove(event: EventTouch) {
        if (!this.isStartFillFoam && !this.isStartClearFoam) {
            return;
        }

        const currentMousePosition = new Vec3(event.getDeltaX(), event.getDeltaY(), 0);
        const delta = currentMousePosition.clone();

        if (this.isStartFillFoam) {
            if (IsContext('TattoContext_3<TatooContext3>') && this.isFirstFillMove) {
                this.isFirstFillMove = false;
                window.tattoContext.trackingManager.trackEvent('pl43_game_step_5_play');
            }

            // let { x, y } = this.foamMachine.getPosition();
            let { x, y } = event.getUILocation();
            let newPos = window.tattoContext.node.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(x, y + 24));
            this.foamMachine.setPosition(newPos);

            // let currentTime = Date.now();

            // if (currentTime - this.lastDrawTime > 500) {
            // this.lastDrawTime = currentTime;
            if (this.cleanFoamNode.children.every((child) => Vec3.distance(newPos, child.getPosition()) >= 175 / 2)) {
                let foamNode = instantiate(this.foamItemPrefab);
                let foamOpacity = foamNode.getComponent(UIOpacity);
                foamOpacity.opacity = 0;
                foamNode.setParent(this.cleanFoamNode);
                foamNode.setPosition(newPos);

                tween(foamOpacity)
                    .by(0.5, {
                        opacity: 255,
                    })
                    .start();

                this.lastFoamItem = newPos;

                let xCanvas = newPos.x + 512 / 2;
                let yCanvas = 512 / 2 - newPos.y;
                this.drawCircle(xCanvas, yCanvas, foamNode.getComponent(UITransform).width / 2, Color.WHITE);
            }

            if (this.timeEscape >= 1 && !this.isHasPlayFoamLoop) {
                this.isHasPlayFoamLoop = true;
                window.tattoContext.audioManager.stop(Constant.EFFECT_NAME.FOAM_START);
                window.tattoContext.audioManager.playMusic(Constant.EFFECT_NAME.FOAM_LOOP, true);
            }
            // }
        }

        if (this.isStartClearFoam) {
            if (IsContext('TattoContext_3<TatooContext3>') && this.isFirstClearMove) {
                this.isFirstClearMove = false;
                window.tattoContext.trackingManager.trackEvent('pl43_game_step_6_play');
            }
            // let { x, y } = this.spongeNode.getPosition();
            // let newPos = new Vec3(x + delta.x, y + delta.y);
            let { x, y } = event.getUILocation();
            let newPos = window.tattoContext.node.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(x, y + 24));
            this.spongeNode.setPosition(newPos);

            if (this.allCirclesCleanPos.every((pos) => Vec3.distance(pos, newPos) >= this.spongeRadius)) {
                this.cleanFoamGraphics.circle(newPos.x, newPos.y, this.spongeRadius);
                this.cleanFoamGraphics.fill();
                this.allCirclesCleanPos.push(newPos);

                let xCanvas = newPos.x + 512 / 2;
                let yCanvas = 512 / 2 - newPos.y;
                this.drawCircle(xCanvas, yCanvas, this.spongeRadius, Color.WHITE);
            }
        }

        this.lastMousePosition = currentMousePosition;
    }

    showFoamMachine() {
        this.foamMachineUIOpacity.opacity = 255;
    }

    hideFoamMachine() {
        this.foamMachineUIOpacity.opacity = 0;
    }

    showSponge() {
        this.spongeUIOpacity.opacity = 255;
    }

    hideSponge() {
        this.spongeUIOpacity.opacity = 0;
    }

    onTouchEnd() {
        this.isTouchDown = false;
        this.timeEscape = 0;
        window.tattoContext.audioManager.stopAll();
        if (this.isFillFullSticker()) {
            this.isHasPlayFoamLoop = false;

            if (this.isStartClearFoam) {
                // console.log('clear foam done');

                this.cleanFoamNode.destroyAllChildren();
                this.allCirclesCleanPos = []
                this.isStartClearFoam = false;
                this.hideSponge();
                this.resetFoamBuffer();
                this.resetMask();
                this.unRegisterTouchEvent();
                window.tattoContext.onCurrentStickerClearFoamDone();

            }

            if (this.isStartFillFoam) {
                this.isStartFillFoam = false;
                this.unRegisterTouchEvent();
                window.tattoContext.onCurrentStickerFillFoamDone();

            }
        }
    }

    isFillFullSticker() {
        return window.tattoContext.currentSticker.patchs.filter(patch => !(patch instanceof PatchLineSticker)).every((patch, index) => {
            let totalMatched = 0;
            for (let i = 0; i < 512 * 512 * 4; i += 4) {
                const maskA = patch.sprayComp.maskBufffer[i + 3];
                if (maskA > 0) {
                    const canvasA = this.foamBuffer[i + 3];
                    if (canvasA > 0) {
                        totalMatched++;
                    }
                }
            }
            let percent = (totalMatched / patch.sprayComp.maskTotalPixel) * 100;
            return percent >= 75;
        });
    }

    resetMask() {
        this.cleanFoamGraphics.clear();
    }

    protected update(dt: number): void {
        if (this.isTouchDown) {
            this.timeEscape += dt;
        }
    }
}
