import {
    _decorator,
    CCBoolean,
    Component,
    EventTouch,
    Graphics,
    instantiate,
    Node,
    Prefab,
    Sprite,
    tween,
    UIOpacity,
    UITransform,
    Vec3,
} from 'cc';
import { Constant } from '../../constant/constant';
import { PatchLineSticker } from './PatchLineSticker';
import { IsContext } from './Utils';

interface FoamCircle {
    position: Vec3;
    radius: number;
}
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

    spongeRadius: number = 0;
    allCirclesCleanPos: Vec3[] = [];
    private foamCircles: FoamCircle[] = [];
    private lastStrokePosition: Vec3 = null;

    timeEscape: number = 0;
    isHasPlayFoamLoop: boolean = false;
    isTouchDown: boolean = false;

    isFirstFillMove: boolean = true;
    isFirstClearMove: boolean = true;

    protected onLoad(): void {
        this.spongeRadius = this.spongeNode.getComponent(UITransform).width
            * Math.abs(this.spongeNode.scale.x) / 2;
        this.hideFoamMachine();
        this.hideSponge();
    }

    startFillFoam() {
        this.cleanFoamNode.destroyAllChildren();
        this.resetMask();
        this.foamCircles = [];
        this.allCirclesCleanPos = [];
        this.resetTouchState();
        this.isFirstFillMove = true;
        this.isFirstClearMove = true;
        this.showFoamMachine();
        this.hideSponge();
        this.isStartFillFoam = true;
        this.isStartClearFoam = false;
        this.foamMachine.setPosition(new Vec3(0, 0, 0));
        this.registerTouchEvent();
    }

    startClearFoam() {
        this.resetTouchState();
        this.allCirclesCleanPos = [];
        this.resetMask();
        this.hideFoamMachine();
        this.showSponge();
        this.isStartClearFoam = true;
        this.isStartFillFoam = false;
        this.spongeNode.setPosition(new Vec3(0, 0, 0));
        this.registerTouchEvent();
    }

    registerTouchEvent() {
        this.unRegisterTouchEvent();
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    unRegisterTouchEvent() {
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    onTouchStart(event: EventTouch) {
        if (!this.isStartFillFoam && !this.isStartClearFoam) return;
        this.isTouchDown = true;
        this.lastStrokePosition = null;
        if (this.isStartFillFoam) {
            window.tattoContext.audioManager.playMusic(Constant.EFFECT_NAME.FOAM_START, true);
        }

        if (this.isStartClearFoam) {
            window.tattoContext.audioManager.playMusic(Constant.EFFECT_NAME.CLEAR_FOAM, true);
        }
        this.onTouchMove(event);
    }

    onTouchMove(event: EventTouch) {
        if (!this.isTouchDown || (!this.isStartFillFoam && !this.isStartClearFoam)) {
            return;
        }

        const { x, y } = event.getUILocation();
        const newPos = this.cleanFoamNode.getComponent(UITransform)
            .convertToNodeSpaceAR(new Vec3(x, y + 24));
        const tool = this.isStartFillFoam ? this.foamMachine : this.spongeNode;
        tool.setPosition(window.tattoContext.convertPositionToTargetParent(newPos, this.cleanFoamNode, tool));

        // Interpolate fast drags so both spraying and wiping leave a continuous path.
        const previous = this.lastStrokePosition ?? newPos;
        const spacing = this.isStartFillFoam ? 35 : Math.max(1, this.spongeRadius * 0.35);
        const steps = Math.max(1, Math.ceil(Vec3.distance(previous, newPos) / spacing));
        for (let i = 1; i <= steps; i++) {
            const point = new Vec3();
            Vec3.lerp(point, previous, newPos, i / steps);
            if (this.isStartFillFoam) this.sprayFoam(point);
            else this.wipeFoam(point);
        }
        this.lastStrokePosition = newPos;
    }

    private sprayFoam(newPos: Vec3): void {
        if (IsContext('TattoContext_3<TatooContext3>') && this.isFirstFillMove) {
            this.isFirstFillMove = false;
            window.tattoContext.trackingManager.trackEvent('pl43_game_step_5_play');
        }

        if (this.foamCircles.every((circle) => Vec3.distance(newPos, circle.position) >= circle.radius * 0.65)) {
            const foamNode = instantiate(this.foamItemPrefab);
            const foamOpacity = foamNode.getComponent(UIOpacity);
            foamOpacity.opacity = 0;
            foamNode.setParent(this.cleanFoamNode);
            foamNode.setPosition(newPos);

            tween(foamOpacity).to(0.5, { opacity: 255 }).start();

            const transform = foamNode.getComponent(UITransform);
            this.foamCircles.push({
                position: newPos.clone(),
                radius: Math.min(transform.width * Math.abs(foamNode.scale.x),
                    transform.height * Math.abs(foamNode.scale.y)) / 2,
            });
        }

        if (this.timeEscape >= 1 && !this.isHasPlayFoamLoop) {
            this.isHasPlayFoamLoop = true;
            window.tattoContext.audioManager.stop(Constant.EFFECT_NAME.FOAM_START);
            window.tattoContext.audioManager.playMusic(Constant.EFFECT_NAME.FOAM_LOOP, true);
        }
    }

    private wipeFoam(newPos: Vec3): void {
        if (IsContext('TattoContext_3<TatooContext3>') && this.isFirstClearMove) {
            this.isFirstClearMove = false;
            window.tattoContext.trackingManager.trackEvent('pl43_game_step_6_play');
        }
        if (this.allCirclesCleanPos.every((pos) => Vec3.distance(pos, newPos) >= this.spongeRadius * 0.3)) {
            this.cleanFoamGraphics.circle(newPos.x, newPos.y, this.spongeRadius);
            this.cleanFoamGraphics.fill();
            this.allCirclesCleanPos.push(newPos.clone());
        }
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
        if (!this.isTouchDown) return;
        this.resetTouchState();
        window.tattoContext.audioManager.stopAll();
        if (this.isFillFullSticker()) {
            if (this.isStartClearFoam) {
                this.cleanFoamNode.destroyAllChildren();
                this.allCirclesCleanPos = [];
                this.foamCircles = [];
                this.isStartClearFoam = false;
                this.hideSponge();
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
        if (this.isStartClearFoam) return this.isFoamWiped();
        if (!this.isStartFillFoam) return false;
        const patches = window.tattoContext.currentSticker.patchs
            .filter(patch => !(patch instanceof PatchLineSticker));
        if (!this.foamCircles.length || !patches.length) return false;
        return patches.every((patch) => {
            const spray = patch.sprayComp;
            const sprite = spray?.maskNode?.getComponent(Sprite);
            const transform = spray?.maskNode?.getComponent(UITransform);
            const frame = sprite?.spriteFrame;
            if (!frame || !transform || !spray.maskBufffer || spray.maskTotalPixel <= 0) return false;

            const width = Math.round(frame.rect.width);
            const height = Math.round(frame.rect.height);
            const sourceWidth = sprite.trim ? width : frame.originalSize.width;
            const sourceHeight = sprite.trim ? height : frame.originalSize.height;
            const trimLeft = sprite.trim ? 0 : frame.trimmedBorder.x;
            const trimTop = sprite.trim ? 0 : -frame.trimmedBorder.w;
            const step = Math.max(1, Math.ceil(Math.max(width, height) / 64));
            let totalMatched = 0;
            let total = 0;
            // Project each mask into the foam layer, including sticker scale and trim.
            for (let y = 0; y < height; y += step) {
                for (let x = 0; x < width; x += step) {
                    if (!spray.maskBufffer[(y * width + x) * 4 + 3]) continue;
                    total++;
                    const maskPoint = new Vec3(
                        (x + trimLeft + 0.5) / sourceWidth * transform.width - transform.width * transform.anchorX,
                        transform.height * (1 - transform.anchorY) - (y + trimTop + 0.5) / sourceHeight * transform.height,
                    );
                    const point = window.tattoContext.convertPositionBetweenNodes(maskPoint, spray.maskNode, this.cleanFoamNode);
                    if (this.foamCircles.some(circle => this.containsPoint(circle.position, point, circle.radius))) totalMatched++;
                }
            }
            return total > 0 && totalMatched / total >= 0.95;
        });
    }

    private isFoamWiped(): boolean {
        if (!this.foamCircles.length || !this.allCirclesCleanPos.length) return false;
        // Check the bubbles actually sprayed, including foam outside the tattoo.
        return this.foamCircles.every(circle => {
            let total = 0;
            let cleaned = 0;
            for (let y = -6; y <= 6; y++) {
                for (let x = -6; x <= 6; x++) {
                    if (x * x + y * y > 36) continue;
                    total++;
                    const point = new Vec3(circle.position.x + x * circle.radius / 6,
                        circle.position.y + y * circle.radius / 6);
                    if (this.allCirclesCleanPos.some(pos => this.containsPoint(pos, point, this.spongeRadius))) cleaned++;
                }
            }
            return cleaned / total >= 0.95;
        });
    }

    private containsPoint(center: Vec3, point: Vec3, radius: number): boolean {
        const dx = center.x - point.x;
        const dy = center.y - point.y;
        return dx * dx + dy * dy <= radius * radius;
    }

    private resetTouchState(): void {
        this.isTouchDown = false;
        this.lastStrokePosition = null;
        this.timeEscape = 0;
        this.isHasPlayFoamLoop = false;
    }

    protected onDisable(): void {
        this.unRegisterTouchEvent();
        if (this.isTouchDown) window.tattoContext.audioManager.stopAll();
        this.resetTouchState();
    }

    protected onEnable(): void {
        if (this.isStartFillFoam || this.isStartClearFoam) this.registerTouchEvent();
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
