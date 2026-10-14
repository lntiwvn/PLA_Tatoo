import { _decorator, AudioSource, Camera, CCFloat, CCInteger, GradientRange, input, Input, instantiate, Label, Node, Prefab, ResolutionPolicy, screen, Tween, tween, UITransform, UIOpacity, Vec3, VideoPlayer, view, Widget } from 'cc';
import { TattoContext } from './TattoContext';
import { TattooSticker } from '../TattooSticker';
import { TattooLineSticker } from '../TattooLineSticker';
import { PatchSticker2 } from '../PatchSticker2';
import { PatchLineSticker } from '../PatchLineSticker';
import { ConcreteAggregate } from '../Iterator/ConcreteAggregate';
import { ColorSelectionController } from '../ColorSelectionController';
const { ccclass, property } = _decorator;

@ccclass('TatooContext1')
export class TatooContext1 extends TattoContext {
    @property(VideoPlayer)
    introVideo: VideoPlayer = null;

    @property({ type: AudioSource, tooltip: 'BGM chỉ phát khi vào game và đã có gesture. Nối từ vị trí video dừng nếu video đã phát âm thanh; nếu chưa thì phát từ đầu. Gán clip BGM và tắt Play On Awake.' })
    bgmAudioSource: AudioSource = null;

    @property(Node)
    endFrame: Node = null;

    @property(Prefab)
    fixedTattooPrefab: Prefab = null;

    @property({
        type: CCFloat,
        tooltip: 'Scale of TattooLineSticker while drawing in the center of the canvas.',
    })
    stickerDrawScale = 0.65;

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
    @property({ type: Widget, tooltip: 'Widget trên BG. Tắt khi code điều khiển vị trí bảng màu để không ghi đè tween.' })
    colorNodeWidget: Widget = null;
    @property({ type: Widget, tooltip: 'Widget của basePos, cập nhật layout trước khi tính điểm bắt đầu.' })
    colorBeginWidget: Widget = null;
    @property({ type: Widget, tooltip: 'Widget của final, cập nhật layout trước khi tính điểm đích.' })
    colorTargetWidget: Widget = null;
    @property(CCFloat)
    colorEntryDuration = 0.5;

    @property(ColorSelectionController)
    colorSelectionController: ColorSelectionController = null;

    @property({ type: [CCInteger], tooltip: 'Số lọ được hint cho từng patch tô màu, tính từ 1 theo thứ tự Color Targets. Mỗi patch chỉ hint một lọ.' })
    colorHintOrder: number[] = [1, 4, 2, 3, 1];

    labelInkTween: Tween<UIOpacity>;
    labelColorTween: Tween<UIOpacity>;
    isFirstShowTextInk: boolean = true;

    isFirstStickerDone: boolean = false;
    private hasStartedDrawing: boolean = false;
    private hasStartedBgm = false;
    private isBgmPlayRequested = false;
    private hasReceivedAudioGesture = false;
    private hasIntroAudioPlayed = false;
    private isIntroAudioRequested = false;
    private bgmStartTime = 0;
    private isAudioInputRegistered = false;
    private colorEntryStarted = false;
    private tattooMachineStarted = false;
    private colorPhaseReady = false;
    private coloringComplete = false;
    private colorHintPatchIndex = 0;
    private machineInputRegistrationTimer: ReturnType<typeof setTimeout> = null;
    private readonly machineInputRegistrationDelay = 150;
    private isIntroVideoPlaying = false;
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
        this.resetColorEntry();
        if (this.sampleSprite) {
            this.sampleSprite.node.active = false;
        }
        this.applyResponsiveLayout(false);
    }

    protected onEnable(): void {
        (view as any).on?.('canvas-resize', this.onCanvasResize, this);
        this.introVideo?.node.on(Node.EventType.SIZE_CHANGED, this.fitIntroVideoToVisibleViewport, this);
        this.fitIntroVideoToVisibleViewport();
    }

    protected onDisable(): void {
        (view as any).off?.('canvas-resize', this.onCanvasResize, this);
        this.introVideo?.node.off(Node.EventType.SIZE_CHANGED, this.fitIntroVideoToVisibleViewport, this);
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
        this.colorPhaseReady = false;
        this.coloringComplete = false;
        this.colorHintPatchIndex = 0;
        this.colorSelectionController?.prepare();
        this.hideGameplayIdleTutorial();
        this.resetColorEntry();

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
        this.hasIntroAudioPlayed = false;
        this.isIntroAudioRequested = false;
        this.bgmStartTime = 0;
        this.unregisterIntroInput();
        this.registerAudioInput();

        if (this.endFrame) {
            this.endFrame.active = false;
        }

        if (!this.introVideo) {
            console.error('TatooContext1: introVideo is not assigned.');
            this.startGameFromIntro();
            return;
        }

        this.isIntroVideoPlaying = true;
        this.registerIntroInput();
        this.introVideo.mute = true;
        this.introVideo.keepAspectRatio = true;
        // Keep the DOM video above the Cocos canvas so the CTA stays behind it.
        (this.introVideo as any).stayOnBottom = false;
        this.introVideo.node.active = true;
        this.fitIntroVideoToVisibleViewport();
        this.updateCtaForCurrentOrientation();
        this.introVideo.node.once(VideoPlayer.EventType.COMPLETED, this.onIntroVideoCompleted, this);
        this.introVideo.node.on(VideoPlayer.EventType.PLAYING, this.onIntroAudioPlaying, this);
        this.introVideo.node.on(VideoPlayer.EventType.CLICKED, this.onIntroTap, this);
        this.introVideo.play();
    }

    private onIntroVideoCompleted(): void {
        // Some video backends reset currentTime when playback completes.
        this.startGameFromIntro(this.introVideo?.duration || this.introVideo?.currentTime || 0);
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
        if (!this.isIntroVideoPlaying) return;
        // DOM video clicks may not reach Cocos global touch input.
        this.hasReceivedAudioGesture = true;

        const duration = this.introVideo?.duration || 0;
        const currentTime = this.introVideo?.currentTime || 0;
        if (duration > 0 && currentTime >= duration * 0.5) {
            this.startGameFromIntro(currentTime);
            return;
        }
        this.enableIntroAudio();
    }

    private enableIntroAudio(): void {
        const video = this.introVideo;
        if (!video || this.hasIntroAudioPlayed || this.isIntroAudioRequested) return;
        this.isIntroAudioRequested = true;
        video.mute = false;
        const nativeVideo = video.nativeVideo;
        if (nativeVideo) {
            nativeVideo.play().then(() => {
                this.isIntroAudioRequested = false;
                this.onIntroAudioPlaying();
            }).catch(() => {
                this.isIntroAudioRequested = false;
                if (this.isIntroVideoPlaying) video.mute = true;
            });
        } else {
            video.play();
            this.onIntroAudioPlaying();
        }
    }

    private onIntroAudioPlaying(): void {
        const video = this.introVideo;
        if (!this.isIntroVideoPlaying || !video || video.mute || video.volume <= 0) return;
        const nativeVideo = video.nativeVideo;
        if (nativeVideo ? !nativeVideo.paused && !nativeVideo.ended : video.isPlaying) {
            this.hasIntroAudioPlayed = true;
        }
    }

    private registerAudioInput(): void {
        if (this.isAudioInputRegistered) return;
        this.isAudioInputRegistered = true;
        input.on(Input.EventType.TOUCH_START, this.onAudioGesture, this);
        input.on(Input.EventType.MOUSE_DOWN, this.onAudioGesture, this);
        input.on(Input.EventType.TOUCH_END, this.onAudioGesture, this);
        input.on(Input.EventType.MOUSE_UP, this.onAudioGesture, this);
    }

    private unregisterAudioInput(): void {
        this.isAudioInputRegistered = false;
        input.off(Input.EventType.TOUCH_START, this.onAudioGesture, this);
        input.off(Input.EventType.MOUSE_DOWN, this.onAudioGesture, this);
        input.off(Input.EventType.TOUCH_END, this.onAudioGesture, this);
        input.off(Input.EventType.MOUSE_UP, this.onAudioGesture, this);
    }

    private onAudioGesture(): void {
        this.hasReceivedAudioGesture = true;
        if (this.isBgmPlayRequested && !this.bgmAudioSource?.playing) {
            this.isBgmPlayRequested = false;
        }
        this.startBgmOnce();
    }

    private onBgmStarted(source: AudioSource): void {
        if (source !== this.bgmAudioSource) return;
        this.hasStartedBgm = true;
        this.isBgmPlayRequested = false;
        source.node.off(AudioSource.EventType.STARTED, this.onBgmStarted, this);
        this.unregisterAudioInput();
    }

    private startBgmOnce(): void {
        if (this.hasStartedBgm || this.isBgmPlayRequested || this.isIntroVideoPlaying
            || !this.hasStartedDrawing || !this.hasReceivedAudioGesture) {
            return;
        }

        const source = this.bgmAudioSource;
        if (!source?.clip) {
            console.error('TatooContext1: assign bgmAudioSource with a BGM clip.');
            return;
        }

        this.isBgmPlayRequested = true;
        source.node.off(AudioSource.EventType.STARTED, this.onBgmStarted, this);
        source.node.on(AudioSource.EventType.STARTED, this.onBgmStarted, this);
        source.playOnAwake = false;
        source.loop = true;
        const time = this.bgmStartTime;
        // Wrap around when the video is longer than the looping music clip.
        source.currentTime = source.duration > 0 ? time % source.duration : time;
        source.play();
    }

    private startGameFromIntro(videoTime = this.introVideo?.currentTime || 0): void {
        if (this.hasStartedDrawing) return;
        // Read the video's time before stop() resets it.
        this.bgmStartTime = this.hasIntroAudioPlayed && Number.isFinite(videoTime)
            ? Math.max(0, videoTime) : 0;
        this.isIntroVideoPlaying = false;
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
            this.introVideo.node.off(VideoPlayer.EventType.PLAYING, this.onIntroAudioPlaying, this);
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
        this.startBgmOnce();
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
        this.startBgmOnce();
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
        const tattooNode = instantiate(this.fixedTattooPrefab);
        tattooNode.parent = this.activeTattooParent;
        this.placeStickerBelowGameplayUI(tattooNode);
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
            onComplete();
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
    }

    private placeStickerBelowGameplayUI(tattooNode: Node): void {
        // The sticker is drawn in the canvas, below the tutorial and CTA nodes.
        // Keep it after the room images so its own artwork stays visible.
        if (tattooNode.parent === this.roomScenePort?.parent) {
            const roomIndex = Math.max(
                this.roomScenePort.getSiblingIndex(),
                this.roomSceneLand.getSiblingIndex(),
            );
            tattooNode.setSiblingIndex(roomIndex + 1);
        }
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
        this.fitIntroVideoToVisibleViewport();
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

    private fitIntroVideoToVisibleViewport(): void {
        const videoNode = this.introVideo?.node;
        const transform = videoNode?.getComponent(UITransform);
        if (!videoNode || !transform || transform.width <= 0 || transform.height <= 0) {
            return;
        }

        // Use the unscaled size, including updates from the video's metadata.
        const visibleSize = view.getVisibleSize();
        const scale = this.isPortraitScreen()
            ? Math.max(1, visibleSize.height) / transform.height
            : Math.max(1, visibleSize.width) / transform.width;
        videoNode.setScale(scale, scale, videoNode.scale.z);
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
            this.placeStickerBelowGameplayUI(this.activeTattooNode);
            this.activeTattooNode.setScale(
                this.activeTattooScale,
                this.activeTattooScale,
                this.activeTattooScale,
            );
        }
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
        const canvas = this.node.parent;
        if (!this.roomScenePort || !this.roomSceneLand || !canvas) {
            console.error(
                'TatooContext1: room scenes and the canvas parent must be assigned.',
            );
            return false;
        }

        this.roomScenePort.active = false;
        this.roomSceneLand.active = false;
        this.activeTattooParent = canvas;
        this.activeTattooScale = this.stickerDrawScale;
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
            this.placeStickerBelowGameplayUI(tattooNode);
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
        if (this.colorPhaseReady) {
            if (this.coloringComplete) return;
            this.coloringComplete = true;
            this.stopTextColorEffect();
            this.audioManager.stopAll();
            if (this.colorNode) this.colorNode.active = false;
            this.showConfetti();
            this.playMoreButton.active = true;
            return;
        }
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

        this.resetColorEntry();
        this.colorSelectionController?.prepare();
        // Resolve both responsive markers while the panel is still hidden.
        this.colorBeginWidget?.updateAlignment();
        this.colorTargetWidget?.updateAlignment();
        const startPosition = this.convertPositionBetweenNodes(Vec3.ZERO, this.colorBeginNode, this.colorTargetNode);
        this.colorNode.setParent(this.colorTargetNode);
        this.colorNode.setPosition(startPosition);
        this.colorNode.active = true;
        this.colorTargetNode.active = true;
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
        const firstPatch = sticker?.currentPatchSticker;
        if (!firstPatch) {
            console.error('TatooContext1: first PatchSticker is not assigned.');
            return;
        }
        this.tattooMachineStarted = true;
        sticker.patchs.forEach((patch) => {
            if (patch === firstPatch) patch.showMachinePatch();
            else patch.hideMachinePatch();
        });
        // Keep the first color guide visible while selecting ink.
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
            console.error('TatooContext1: Color selection controller is not assigned.');
            return;
        }
        const hintIndex = (this.colorHintOrder[this.colorHintPatchIndex] ?? 1) - 1;
        this.colorSelectionController.beginSelection((index) => {
            if (this.coloringComplete) return;
            const color = this.colorSelectionController.getPaintColor(index);
            sticker.currentGroup.forEach((patch) => {
                if (!(patch instanceof PatchLineSticker)) {
                    patch.sprayColor = color.clone();
                    patch.sprayComp.sprayColor = color.clone();
                }
            });
            if (this.drawVfxParticle) {
                const gradient = new GradientRange();
                gradient.color = color.clone();
                this.drawVfxParticle.startColor = gradient;
            }
            // Further selections only update ink; keep the current patch and stroke.
            if (this.colorPhaseReady || this.machineInputRegistrationTimer !== null) return;
            // Finish the selection touch before registering painting input.
            this.machineInputRegistrationTimer = setTimeout(() => {
                this.machineInputRegistrationTimer = null;
                firstPatch.hideMachinePatch();
                this.colorPhaseReady = true;
                sticker.resumeColorPhase();
            }, this.machineInputRegistrationDelay);
        }, hintIndex);
    }

    private resetColorEntry(): void {
        if (!this.colorNode) return;
        Tween.stopAllByTarget(this.colorNode);
        this.colorNode.active = false;
        if (this.colorTargetNode) this.colorTargetNode.active = false;
        if (this.colorNodeWidget) this.colorNodeWidget.enabled = false;
        if (this.colorBeginNode) {
            this.colorBeginWidget?.updateAlignment();
            this.colorNode.setParent(this.colorBeginNode);
            this.colorNode.setPosition(Vec3.ZERO);
        }
    }

    onColorPatchDrawStarted(): void {
        this.resetColorEntry();
    }

    onColorPatchGroupDone(): void {
        this.resetColorEntry();
        this.colorHintPatchIndex++;
        this.colorPhaseReady = false;
        this.colorEntryStarted = false;
        this.tattooMachineStarted = false;
    }

    private stopTattooMachinePhase(hideVisuals = true): void {
        if (this.machineInputRegistrationTimer !== null) {
            clearTimeout(this.machineInputRegistrationTimer);
            this.machineInputRegistrationTimer = null;
        }
        if (hideVisuals) {
            const sticker = this.tattooStickers[0] as TattooLineSticker;
            sticker?.patchs?.forEach((patch) => patch.hideMachinePatch());
        }
    }

    onDestroy(): void {
        this.isIntroVideoPlaying = false;
        this.unregisterIntroInput();
        this.unregisterAudioInput();
        this.bgmAudioSource?.node.off(AudioSource.EventType.STARTED, this.onBgmStarted, this);
        if (this.introVideo) {
            this.introVideo.node.off(VideoPlayer.EventType.COMPLETED, this.onIntroVideoCompleted, this);
        }
        this.stopTattooMachinePhase();
    }

    shouldSkipColorPatchPhase(): boolean {
        return !this.colorPhaseReady;
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
            this.sampleSprite.node.active = true;
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
