import { _decorator, Camera, CCFloat, input, Input, instantiate, Label, Node, Prefab, ResolutionPolicy, screen, Tween, tween, UITransform, UIOpacity, Vec3, VideoPlayer, view } from 'cc';
import { TattoContext } from './TattoContext';
import { TattooSticker } from '../TattooSticker';
import { TattooLineSticker } from '../TattooLineSticker';
import { PatchSticker2 } from '../PatchSticker2';
import { PatchLineSticker } from '../PatchLineSticker';
import { ConcreteAggregate } from '../Iterator/ConcreteAggregate';
import { ColorSelectionController } from '../ColorSelectionController';
import { SuperHtml } from '../../utils/SuperHtml';
import { Constant } from '../../../constant/constant';
const { ccclass, property } = _decorator;

@ccclass('TatooContext1')
export class TatooContext1 extends TattoContext {
    @property(VideoPlayer)
    introVideo: VideoPlayer = null;

    @property(Node)
    endFrame: Node = null;

    @property(Prefab)
    fixedTattooPrefab: Prefab = null;

    @property({
        type: Node,
        group: 'Orientation room',
        tooltip: 'Node roomscene_port, displayed when the screen is portrait.',
    })
    roomScenePort: Node = null;

    @property({
        type: Node,
        group: 'Orientation room',
        tooltip: 'The tat_pos node inside roomscene_port.',
    })
    tatPosPort: Node = null;

    @property({
        type: CCFloat,
        group: 'Orientation room',
        tooltip: 'Uniform scale applied to the fixed tattoo prefab on a portrait screen.',
    })
    tattooScalePort = 1;

    @property({
        type: Node,
        group: 'Orientation room',
        tooltip: 'Node roomscene_land, displayed when the screen is landscape.',
    })
    roomSceneLand: Node = null;

    @property({
        type: Node,
        group: 'Orientation room',
        tooltip: 'The tat_pos node inside roomscene_land.',
    })
    tatPosLand: Node = null;

    @property({
        type: CCFloat,
        group: 'Orientation room',
        tooltip: 'Uniform scale applied to the fixed tattoo prefab on a landscape screen.',
    })
    tattooScaleLand = 1;

    @property({
        type: Node,
        group: 'Gameplay zoom',
        tooltip: 'Optional zoom root. Leave empty to create GameplayZoomRoot automatically at runtime.',
    })
    gameplayZoomRoot: Node = null;

    @property({
        type: CCFloat,
        group: 'Gameplay zoom',
        tooltip: 'Gameplay zoom scale on a portrait screen.',
    })
    zoomScalePort = 1.35;

    @property({
        type: CCFloat,
        group: 'Gameplay zoom',
        tooltip: 'Gameplay zoom scale on a landscape screen.',
    })
    zoomScaleLand = 1.35;

    @property({
        type: CCFloat,
        group: 'Gameplay zoom',
        tooltip: 'Duration of the zoom animation in seconds.',
    })
    zoomDuration = 0.5;

    @property({
        type: CCFloat,
        group: 'Gameplay zoom',
        tooltip: 'Delay before the gameplay zoom starts, in seconds.',
    })
    zoomDelay = 0.5;

    @property({
        type: CCFloat,
        group: 'Responsive',
        tooltip: 'Canvas design width used by the responsive resolution policy.',
    })
    responsiveDesignWidth = 720;

    @property({
        type: CCFloat,
        group: 'Responsive',
        tooltip: 'Canvas design height used by the responsive resolution policy.',
    })
    responsiveDesignHeight = 1280;

    @property({
        type: Node,
        group: 'Responsive CTA',
        tooltip: 'CTA node displayed when the screen is portrait.',
    })
    ctaPort: Node = null;

    @property({
        type: Node,
        group: 'Responsive CTA',
        tooltip: 'CTA node displayed when the screen is landscape.',
    })
    ctaLand: Node = null;

    @property({
        type: Node,
        group: 'Gameplay idle tutorial',
        tooltip: 'Parent node containing the tutorial hand, effect, and EndFrameHint component.',
    })
    parentTutHand: Node = null;

    @property({
        type: CCFloat,
        group: 'Gameplay idle tutorial',
        tooltip: 'Seconds to wait after gameplay becomes ready before showing the tutorial hand.',
        min: 0,
    })
    gameplayTutHandDelay = 3;

    @property(UIOpacity)
    selectTattOpacity: UIOpacity = null;
    @property(UIOpacity)
    backgroundContextOpacity: UIOpacity = null;

    @property(Node)
    modelNode: Node = null;

    isDrawMainTattoo: boolean = true;

    @property(Camera)
    tattooCamera: Camera = null;

    @property(Label)
    labelInk: Label = null;
    @property(Label)
    labelColor: Label = null;

    @property(Node)
    colorNode: Node = null;
    @property(Node)
    colorBeginNode: Node = null;
    @property(Node)
    colorTargetNode: Node = null;
    @property(CCFloat)
    colorEntryDuration = 0.5;

    @property(ColorSelectionController)
    colorSelectionController: ColorSelectionController = null;

    labelInkTween: Tween<UIOpacity>;
    labelColorTween: Tween<UIOpacity>;
    isFirstShowTextInk: boolean = true;

    isFirstStickerDone: boolean = false;
    private hasStartedDrawing: boolean = false;
    private colorEntryStarted = false;
    private tattooMachineStarted = false;
    private machineInputReady = false;
    private machineInputRegistrationTimer: ReturnType<typeof setTimeout> = null;
    private readonly machineInputRegistrationDelay = 150;
    private isIntroVideoPlaying = false;
    private hasEnabledIntroAudio = false;
    private isWaitingForIntroTap = false;
    private isIntroInputRegistered = false;
    private activeTattooParent: Node = null;
    private activeTattooScale = 1;
    private activeZoomScale = 1;
    private preparedTattooNode: Node = null;
    private activeTattooNode: Node = null;
    private isApplyingResponsiveResolution = false;
    private isGameplayZoomComplete = false;
    private isGameplayPenVisible = false;
    private isGameplayTextVisible = false;
    private readonly baseBlinkHalfDuration = 0.25;

    protected onLoad(): void {
        super.onLoad();
        if (this.sampleSprite) {
            this.sampleSprite.node.active = false;
        }
        this.applyResponsiveLayout(false);
    }

    protected onEnable(): void {
        (view as any).on?.('canvas-resize', this.onCanvasResize, this);
    }

    protected onDisable(): void {
        (view as any).off?.('canvas-resize', this.onCanvasResize, this);
        this.hideGameplayIdleTutorial();
    }

    start(): void {
        this.applyResponsiveLayout(false);
        this.textTutorial.active = false;
        this.handTutorial.active = false;
        this.labelInk.node.active = false;
        this.labelColor.node.active = false;
        this.colorEntryStarted = false;
        this.tattooMachineStarted = false;
        this.colorSelectionController?.prepare();
        this.hideGameplayIdleTutorial();
        if (this.colorNode && this.colorBeginNode) {
            this.colorNode.active = false;
            this.colorNode.setParent(this.colorBeginNode);
            this.colorNode.setPosition(Vec3.ZERO);
        }

        // The old entry UI/button is no longer part of the start flow.
        this.selectTattOpacity.node.active = false;
        if (this.roomScenePort) this.roomScenePort.active = false;
        if (this.roomSceneLand) this.roomSceneLand.active = false;
        this.playIntroVideo();
    }

    private playIntroVideo(): void {
        // CTA is visible from the intro video, so resolve its orientation before
        // the video starts instead of waiting for the gameplay transition.
        this.updateCtaForCurrentOrientation();

        this.isIntroVideoPlaying = false;
        this.hasEnabledIntroAudio = false;
        this.isWaitingForIntroTap = false;
        this.unregisterIntroInput();

        if (this.endFrame) {
            this.endFrame.active = false;
        } else {
            console.error('TatooContext1: endFrame is not assigned.');
        }

        if (!this.introVideo) {
            console.error('TatooContext1: introVideo is not assigned.');
            this.showEndFrameAndWaitForTap();
            return;
        }

        this.isIntroVideoPlaying = true;
        this.registerIntroInput();
        this.introVideo.mute = true;
        // Keep the DOM video above the Cocos canvas so the CTA stays behind it.
        (this.introVideo as any).stayOnBottom = false;
        this.introVideo.node.active = true;
        this.updateCtaForCurrentOrientation();
        this.introVideo.node.once(VideoPlayer.EventType.COMPLETED, this.onIntroVideoCompleted, this);
        this.introVideo.node.on(VideoPlayer.EventType.CLICKED, this.onIntroTap, this);
        this.introVideo.play();
    }

    private onIntroVideoCompleted(): void {
        this.isIntroVideoPlaying = false;
        if (this.introVideo) {
            this.introVideo.node.off(VideoPlayer.EventType.CLICKED, this.onIntroTap, this);
            this.introVideo.node.active = false;
        }
        this.showEndFrameAndWaitForTap();
    }

    private showEndFrameAndWaitForTap(): void {
        if (this.endFrame) {
            this.endFrame.active = true;
        }

        this.isWaitingForIntroTap = true;
        this.registerIntroInput();
    }

    private registerIntroInput(): void {
        if (this.isIntroInputRegistered) {
            return;
        }

        this.isIntroInputRegistered = true;
        input.on(Input.EventType.TOUCH_START, this.onIntroTap, this);
        input.on(Input.EventType.MOUSE_DOWN, this.onIntroTap, this);
    }

    private onIntroTap(): void {
        if (this.isIntroVideoPlaying) {
            const duration = this.introVideo?.duration || 0;
            const currentTime = this.introVideo?.currentTime || 0;
            if (duration > 0 && currentTime >= duration * 0.5) {
                this.startGameFromIntro();
                return;
            }

            if (!this.hasEnabledIntroAudio && this.introVideo) {
                this.hasEnabledIntroAudio = true;
                this.introVideo.mute = false;
                this.introVideo.play();
            }
            return;
        }

        if (!this.isWaitingForIntroTap) {
            return;
        }

        this.startGameFromIntro();
    }

    private startGameFromIntro(): void {
        this.isIntroVideoPlaying = false;
        this.isWaitingForIntroTap = false;
        this.unregisterIntroInput();
        if (this.introVideo) {
            this.introVideo.node.off(VideoPlayer.EventType.COMPLETED, this.onIntroVideoCompleted, this);
            this.introVideo.stop();
            this.introVideo.node.active = false;
        }
        if (this.endFrame) {
            this.endFrame.active = false;
        }
        this.onClickDoIt();
    }

    private unregisterIntroInput(): void {
        this.isIntroInputRegistered = false;
        input.off(Input.EventType.TOUCH_START, this.onIntroTap, this);
        input.off(Input.EventType.MOUSE_DOWN, this.onIntroTap, this);
        if (this.introVideo) {
            this.introVideo.node.off(VideoPlayer.EventType.CLICKED, this.onIntroTap, this);
        }
    }

    onClickDoIt() {
        if (this.hasStartedDrawing) {
            return;
        }

        if (!this.fixedTattooPrefab) {
            console.error('TatooContext1: fixedTattooPrefab is not assigned.');
            return;
        }

        if (!this.applyRoomForCurrentOrientation()) {
            return;
        }

        this.hasStartedDrawing = true;
        this.audioManager.init();
        this.audioManager.playMusic(Constant.AUDIO_NAME.BGM, true, true);
        this.isGameplayZoomComplete = false;
        this.isGameplayPenVisible = false;
        this.isGameplayTextVisible = false;
        if (this.sampleSprite) {
            this.sampleSprite.node.active = false;
        }
        this.handTutorial.active = false;
        this.textTutorial.active = false;

        this.selectTattOpacity.node.active = false;
        this.modelNode.active = false;

        this.prepareTattooBasePreview(() => this.startGameplayFlow());
    }

    private startGameplayFlow(): void {
        this.isGameplayZoomComplete = true;
        this.tryShowGameplaySample();

        tween(this.backgroundContextOpacity).to(0.5, {
            opacity: 255
        }).start();
        tween(this.selectTattOpacity).to(0.5, {
            opacity: 0
        }).call(() => {
            this.tattooCamera.usePostProcess = true;
            this.enableTextInkEffect();
        }).start();

        this.node.on(Input.EventType.TOUCH_START, this.onFirstTouch, this);
        this.node.on(Input.EventType.MOUSE_DOWN, this.onFirstTouch, this);
        this.scheduleGameplayIdleTutorial();
        this.audioManager.init();
        this.init();
        this.onIntro();
    }

    onFirstTouch(): void {
        this.hideGameplayIdleTutorial();
        super.onFirstTouch();
    }

    private scheduleGameplayIdleTutorial(): void {
        this.unschedule(this.showGameplayIdleTutorial);
        if (this.parentTutHand?.isValid) {
            this.parentTutHand.active = false;
        }

        if (!this.canShowGameplayIdleTutorial()) {
            return;
        }

        this.scheduleOnce(this.showGameplayIdleTutorial, Math.max(0, this.gameplayTutHandDelay));
    }

    private showGameplayIdleTutorial = (): void => {
        if (!this.canShowGameplayIdleTutorial()) {
            return;
        }

        this.parentTutHand.active = true;
    };

    private hideGameplayIdleTutorial(): void {
        this.unschedule(this.showGameplayIdleTutorial);
        if (this.parentTutHand?.isValid) {
            this.parentTutHand.active = false;
        }
    }

    private canShowGameplayIdleTutorial(): boolean {
        if (
            !this.hasStartedDrawing
            || this.colorEntryStarted
            || this.tattooMachineStarted
            || !this.parentTutHand?.isValid
        ) {
            return false;
        }

        return !!this.getActiveLineSticker()?.isWaitingForManualDrawInput();
    }

    private getActiveLineSticker(): TattooLineSticker | null {
        const currentSticker = this.currentSticker as unknown;
        if (currentSticker instanceof TattooLineSticker) {
            return currentSticker;
        }

        const activeTattooLineSticker = this.activeTattooNode?.getComponent(TattooLineSticker);
        if (activeTattooLineSticker) {
            return activeTattooLineSticker;
        }

        const tattooLineSticker = this.tattooStickers.find((sticker) => (sticker as unknown) instanceof TattooLineSticker);
        return (tattooLineSticker as unknown as TattooLineSticker) ?? null;
    }

    private prepareTattooBasePreview(onComplete: () => void): void {
        this.ensureGameplayZoomHierarchy();

        const tattooNode = instantiate(this.fixedTattooPrefab);
        tattooNode.parent = this.activeTattooParent;
        tattooNode.setScale(this.activeTattooScale, this.activeTattooScale, this.activeTattooScale);
        this.preparedTattooNode = tattooNode;
        this.activeTattooNode = tattooNode;

        const tattooLineSticker = tattooNode.getComponent(TattooLineSticker);
        const baseNode = tattooLineSticker?.basePreview;
        const baseOpacity = baseNode?.getComponent(UIOpacity);

        if (!baseNode || !baseOpacity) {
            console.error(
                'TatooContext1: assign the base node with a UIOpacity component to TattooLineSticker.basePreview.',
            );
            this.playGameplayZoom(onComplete);
            return;
        }

        const childActiveStates = tattooNode.children.map((child) => ({
            child,
            active: child.active,
        }));

        childActiveStates.forEach(({ child }) => {
            child.active = child === baseNode;
        });
        baseNode.active = true;
        baseOpacity.opacity = 255;
        Tween.stopAllByTarget(baseOpacity);

        this.playGameplayZoom(() => {
            tween(baseOpacity)
                .to(this.baseBlinkHalfDuration, { opacity: 0 })
                .to(this.baseBlinkHalfDuration, { opacity: 255 })
                .union()
                .repeat(3)
                .call(() => {
                    baseNode.active = false;
                    childActiveStates.forEach(({ child, active }) => {
                        if (child !== baseNode) child.active = active;
                    });
                    onComplete();
                })
                .start();
        });
    }

    private ensureGameplayZoomHierarchy(): void {
        if (!this.gameplayZoomRoot) {
            const commonParent = this.roomScenePort?.parent;
            if (!commonParent) {
                console.error('TatooContext1: room scenes require a common parent to create GameplayZoomRoot.');
                return;
            }

            const firstRoomIndex = Math.min(
                this.roomScenePort.getSiblingIndex(),
                this.roomSceneLand.getSiblingIndex(),
            );
            this.gameplayZoomRoot = new Node('GameplayZoomRoot');
            this.gameplayZoomRoot.layer = this.roomScenePort.layer;
            this.gameplayZoomRoot.setParent(commonParent);
            this.gameplayZoomRoot.setPosition(Vec3.ZERO);
            this.gameplayZoomRoot.setSiblingIndex(firstRoomIndex);
        }

        Tween.stopAllByTarget(this.gameplayZoomRoot);
        this.gameplayZoomRoot.setPosition(Vec3.ZERO);
        this.gameplayZoomRoot.setScale(Vec3.ONE);

        this.moveNodeToZoomRoot(this.roomScenePort);
        this.moveNodeToZoomRoot(this.roomSceneLand);

        // Keep both tattoo machines outside the scaled root. Their positions are
        // converted from the tattoo/path world space by TattoContext, so they
        // still follow the zoomed artwork without their visuals being enlarged.
    }

    private moveNodeToZoomRoot(node: Node): void {
        if (!node || !this.gameplayZoomRoot || node.parent === this.gameplayZoomRoot) {
            return;
        }
        node.setParent(this.gameplayZoomRoot, true);
    }

    private playGameplayZoom(onComplete: () => void): void {
        const zoomRoot = this.gameplayZoomRoot;
        const zoomTarget = this.activeTattooParent;
        const zoomParent = zoomRoot?.parent;
        if (!zoomRoot || !zoomTarget || !zoomParent) {
            onComplete();
            return;
        }

        const targetInParent = new Vec3();
        zoomParent.inverseTransformPoint(targetInParent, zoomTarget.worldPosition);
        const scale = Math.max(0.01, this.activeZoomScale);
        const targetPosition = new Vec3(-targetInParent.x * scale, -targetInParent.y * scale, 0);
        const targetScale = new Vec3(scale, scale, scale);
        const duration = Math.max(0, this.zoomDuration);
        const delay = Math.max(0, this.zoomDelay);

        if (duration === 0 && delay === 0) {
            zoomRoot.setPosition(targetPosition);
            zoomRoot.setScale(targetScale);
            onComplete();
            return;
        }

        const zoomTween = tween(zoomRoot).delay(delay);
        if (duration === 0) {
            zoomTween.call(() => {
                zoomRoot.setPosition(targetPosition);
                zoomRoot.setScale(targetScale);
            });
        } else {
            zoomTween.to(duration, {
                position: targetPosition,
                scale: targetScale,
            }, { easing: 'sineInOut' });
        }
        zoomTween.call(onComplete).start();
    }

    private onCanvasResize(): void {
        if (this.isApplyingResponsiveResolution) {
            return;
        }
        this.applyResponsiveLayout(true);
    }

    private applyResponsiveLayout(updateStartedGameplay: boolean): void {
        this.applyResponsiveResolutionPolicy();
        this.updateCtaForCurrentOrientation();
        this.fitRoomToVisibleViewport(this.roomScenePort);
        this.fitRoomToVisibleViewport(this.roomSceneLand);

        if (!updateStartedGameplay || !this.hasStartedDrawing || this.preparedTattooNode) {
            return;
        }

        this.refreshStartedGameplayLayout();
    }

    private applyResponsiveResolutionPolicy(): void {
        const windowWidth = Math.max(1, screen.windowSize.width);
        const windowHeight = Math.max(1, screen.windowSize.height);
        const designWidth = Math.max(1, this.responsiveDesignWidth);
        const designHeight = Math.max(1, this.responsiveDesignHeight);
        const frameRatio = windowWidth / windowHeight;
        const designRatio = designWidth / designHeight;
        const policy = frameRatio > designRatio
            ? ResolutionPolicy.FIXED_HEIGHT
            : ResolutionPolicy.FIXED_WIDTH;

        this.isApplyingResponsiveResolution = true;
        try {
            view.setDesignResolutionSize(designWidth, designHeight, policy);
        } finally {
            this.isApplyingResponsiveResolution = false;
        }
    }

    private isPortraitScreen(): boolean {
        const windowWidth = Math.max(1, screen.windowSize.width);
        const windowHeight = Math.max(1, screen.windowSize.height);
        return windowHeight >= windowWidth;
    }

    private updateCtaForCurrentOrientation(): void {
        const usePortrait = this.isPortraitScreen();
        this.keepCtaRootVisible(this.ctaPort);
        this.keepCtaRootVisible(this.ctaLand);
        if (this.ctaPort) this.ctaPort.active = usePortrait;
        if (this.ctaLand) this.ctaLand.active = !usePortrait;
    }

    private keepCtaRootVisible(ctaNode: Node): void {
        const ctaRoot = ctaNode?.parent;
        if (!ctaRoot) {
            return;
        }

        ctaRoot.active = true;
        if (ctaRoot.parent) {
            ctaRoot.setSiblingIndex(ctaRoot.parent.children.length - 1);
        }
    }

    private fitRoomToVisibleViewport(roomNode: Node): void {
        const transform = roomNode?.getComponent(UITransform);
        if (!roomNode || !transform) {
            return;
        }

        const visibleSize = view.getVisibleSize();
        const sourceWidth = Math.max(0.01, transform.width);
        const sourceHeight = Math.max(0.01, transform.height);
        const coverScale = Math.max(
            Math.max(1, visibleSize.width) / sourceWidth,
            Math.max(1, visibleSize.height) / sourceHeight,
        );
        roomNode.setScale(coverScale, coverScale, coverScale);
    }

    private refreshStartedGameplayLayout(): void {
        if (this.gameplayZoomRoot) {
            Tween.stopAllByTarget(this.gameplayZoomRoot);
            this.gameplayZoomRoot.setPosition(Vec3.ZERO);
            this.gameplayZoomRoot.setScale(Vec3.ONE);
        }

        if (!this.applyRoomForCurrentOrientation()) {
            return;
        }

        if (this.activeTattooNode) {
            this.activeTattooNode.setParent(this.activeTattooParent);
            this.activeTattooNode.setPosition(Vec3.ZERO);
            this.activeTattooNode.setScale(
                this.activeTattooScale,
                this.activeTattooScale,
                this.activeTattooScale,
            );
        }

        this.ensureGameplayZoomHierarchy();
        this.applyGameplayZoomImmediately();
    }

    private applyGameplayZoomImmediately(): void {
        const zoomRoot = this.gameplayZoomRoot;
        const zoomTarget = this.activeTattooParent;
        const zoomParent = zoomRoot?.parent;
        if (!zoomRoot || !zoomTarget || !zoomParent) {
            return;
        }

        const targetInParent = new Vec3();
        zoomParent.inverseTransformPoint(targetInParent, zoomTarget.worldPosition);
        const scale = Math.max(0.01, this.activeZoomScale);
        zoomRoot.setPosition(-targetInParent.x * scale, -targetInParent.y * scale, 0);
        zoomRoot.setScale(scale, scale, scale);
    }

    private applyRoomForCurrentOrientation(): boolean {
        const usePortrait = this.isPortraitScreen();
        const activeTatPos = usePortrait ? this.tatPosPort : this.tatPosLand;

        if (!this.roomScenePort || !this.tatPosPort || !this.roomSceneLand || !this.tatPosLand) {
            console.error(
                'TatooContext1: roomScenePort, tatPosPort, roomSceneLand and tatPosLand must be assigned.',
            );
            return false;
        }

        this.roomScenePort.active = usePortrait;
        this.roomSceneLand.active = !usePortrait;
        this.activeTattooParent = activeTatPos;
        this.activeTattooScale = usePortrait ? this.tattooScalePort : this.tattooScaleLand;
        this.activeZoomScale = usePortrait ? this.zoomScalePort : this.zoomScaleLand;
        return true;
    }

    onPlay(): void {
        this.tattooStickers.length = 0;
        this.stickerTattoIndex = -1;
        this.loadTattooSticker(0);
        this.stickerAggregate = new ConcreteAggregate<TattooSticker>();
        this.stickerAggregate.addItem(this.tattooStickers);
        this.stickerIterator = this.stickerAggregate.createIterator();
        this.playNextSticker();
    }

    loadTattooSticker(_itemIndex: number) {
        const prefab = this.fixedTattooPrefab;
        if (!prefab) {
            console.error('TatooContext1: fixedTattooPrefab is not assigned.');
            return;
        }
        let tattooNode = this.preparedTattooNode;
        this.preparedTattooNode = null;
        if (!tattooNode) {
            tattooNode = instantiate(prefab);
            tattooNode.parent = this.activeTattooParent;
            tattooNode.setScale(this.activeTattooScale, this.activeTattooScale, this.activeTattooScale);
        }
        this.activeTattooNode = tattooNode;
        let tattooSticker = tattooNode.getComponent(TattooSticker);
        let tattooLineSticker = tattooNode.getComponent(TattooLineSticker);
        if (tattooSticker) {
            tattooSticker.init();
            this.tattooStickers.push(tattooSticker);
        } else {
            tattooLineSticker.init();
            this.tattooStickers.push(tattooLineSticker);
        }
    }

    onCurrentStickerClearFoamDone() {
        if (this.stickerIterator.getCurrentPosition() === 1) {
            this.isFirstStickerDone = true;
        }

        this.playNextSticker();
    }

    onCurrentStickerDone() {
        this.hideGameplayIdleTutorial();
        if (this.colorEntryStarted || this.tattooMachineStarted) {
            return;
        }
        this.colorEntryStarted = true;

        this.startColorEntry();
    }

    private startColorEntry(): void {

        if (!this.colorNode || !this.colorBeginNode || !this.colorTargetNode) {
            console.error('TatooContext1: Color entry references are not assigned.');
            return;
        }

        Tween.stopAllByTarget(this.colorNode);
        this.colorNode.active = false;
        this.colorNode.setParent(this.colorBeginNode);
        this.colorNode.setPosition(Vec3.ZERO);
        this.colorNode.setParent(this.colorTargetNode, true);
        this.colorNode.active = true;
        tween(this.colorNode)
            .to(this.colorEntryDuration, { position: Vec3.ZERO })
            .call(() => {
                console.log('Color node entry completed');
                this.beginTattooMachinePhase();
            })
            .start();
    }

    private beginTattooMachinePhase(): void {
        if (this.tattooMachineStarted) return;
        const sticker = this.tattooStickers[0] as TattooLineSticker;
        const firstPatch = sticker?.patchs?.find((patch) => !(patch instanceof PatchLineSticker));
        if (!firstPatch) {
            console.error('TatooContext1: first PatchSticker is not assigned.');
            return;
        }
        this.tattooMachineStarted = true;
        this.machineInputReady = false;
        sticker.patchs.forEach((patch) => {
            if (patch === firstPatch) patch.showMachinePatch();
            else patch.hideMachinePatch();
        });
        // showFinalImageOnly() may have hidden this child at the line-complete
        // boundary. Keep the selected machine patch visible for color selection.
        firstPatch.node.active = true;
        if (this.tattoMachineOpacity) {
            this.tattoMachineOpacity.opacity = 255;
        } else {
            console.error('TatooContext1: tattoo machine opacity reference is not assigned.');
        }
        if (this.tattoMachine) {
            this.tattoMachine.active = true;
        } else {
            console.error('TatooContext1: tattoo machine reference is not assigned.');
        }
        if (!this.colorSelectionController) {
            console.error('TatooContext1: Color selection controller is not assigned; Store cannot be opened from color selection.');
            return;
        }
        this.colorSelectionController.beginSelection(() => {
            this.enableTextColorEffect();
            // The color tap opens the Store immediately. Register the persistent
            // screen listener afterward so the same tap is not handled twice.
            this.enableMachineStoreInput();
            SuperHtml.instance?.actDownload();
        });
    }

    private enableMachineStoreInput(): void {
        if (this.machineInputRegistrationTimer !== null || this.machineInputReady || !this.tattooMachineStarted) {
            return;
        }
        this.machineInputRegistrationTimer = setTimeout(() => {
            this.machineInputRegistrationTimer = null;
            if (!this.tattooMachineStarted) return;
            this.machineInputReady = true;
            this.node.on(Input.EventType.TOUCH_START, this.onTattooMachineTouch, this);
        }, this.machineInputRegistrationDelay);
    }

    private onTattooMachineTouch(): void {
        if (!this.tattooMachineStarted || !this.machineInputReady) return;
        SuperHtml.instance?.actDownload();
    }

    private stopTattooMachinePhase(hideVisuals = true): void {
        if (this.machineInputRegistrationTimer !== null) {
            clearTimeout(this.machineInputRegistrationTimer);
            this.machineInputRegistrationTimer = null;
        }
        this.machineInputReady = false;
        this.node.off(Input.EventType.TOUCH_START, this.onTattooMachineTouch, this);
        if (hideVisuals) {
            const sticker = this.tattooStickers[0] as TattooLineSticker;
            sticker?.patchs?.forEach((patch) => patch.hideMachinePatch());
        }
    }

    onDestroy(): void {
        this.isIntroVideoPlaying = false;
        this.unregisterIntroInput();
        if (this.introVideo) {
            this.introVideo.node.off(VideoPlayer.EventType.COMPLETED, this.onIntroVideoCompleted, this);
        }
        this.stopTattooMachinePhase();
    }

    shouldSkipColorPatchPhase(): boolean {
        return true;
    }

    enableTextColorEffect() {
        this.isFirstShowTextInk = false;
        this.labelColor.node.active = true;
        this.labelColorTween = tween(this.labelColor.getComponent(UIOpacity))
            .to(0.5, { opacity: 100 })
            .to(0.5, { opacity: 255 })
            .union()
            .repeatForever()
            .start();
    }

    enableTextInkEffect() {
        this.labelInk.node.active = true;
        this.labelInkTween = tween(this.labelInk.getComponent(UIOpacity))
            .to(0.5, { opacity: 100 })
            .to(0.5, { opacity: 255 })
            .union()
            .repeatForever()
            .start();
        this.isGameplayTextVisible = true;
        this.tryShowGameplaySample();
    }

    onShowNextPatchDone(patchIndex: number): void {
        if (patchIndex === 0) {
            this.isGameplayPenVisible = true;
            this.tryShowGameplaySample();
        }

        this.scheduleGameplayIdleTutorial();
    }

    private tryShowGameplaySample(): void {
        if (
            !this.isGameplayZoomComplete
            || !this.isGameplayPenVisible
            || !this.isGameplayTextVisible
        ) {
            return;
        }

        if (this.sampleSprite) {
            // this.sampleSprite.node.active = true;
        }
    }

    stopTextInkEffect() {
        if(this.labelInkTween) {
            this.labelInkTween.stop();
        }
        this.labelInk.getComponent(UIOpacity).opacity = 255;
        this.labelInk.node.active = false;
    }

    stopTextColorEffect() {
        if(this.labelColorTween) {
            this.labelColorTween.stop();
        }
        this.labelColor.getComponent(UIOpacity).opacity = 255;
        this.labelColor.node.active = false;
    }

    playNextSticker() {
        this.currentSticker = this.stickerIterator.next();
        if (this.currentSticker) {
            this.stickerTattoIndex++;


            if (this.stickerTattoIndex - 1 >= 0) {
                this.tattooStickers[this.stickerTattoIndex - 1].patchs.forEach((patch) => {
                    if (patch instanceof PatchSticker2) {
                        patch.showOverlay();
                    }
                });
                // console.log(this.stickerTattoIndex, this.stickerTattoIndex - 1, this.tattooStickers[this.stickerTattoIndex - 1]);
            }

            this.currentSticker.showNextPatch();
        } else {
            this.tattooStickers.forEach((sticker) => {
                sticker.patchs.forEach((patch) => {
                    if (patch instanceof PatchSticker2) {
                        patch.hideOverlay();
                    }
                })
            });
            // console.log('done all sticker');
            this.showConfetti();
            this.playMoreButton.active = true;
        }
    }
}
