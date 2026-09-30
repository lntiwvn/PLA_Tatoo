import { _decorator, Component, macro, screen, UITransform, view, ResolutionPolicy } from 'cc';
const { ccclass, property, executionOrder } = _decorator;

@ccclass('ResponsiveScreen')
@executionOrder(-1000)
export class ResponsiveScreen extends Component {
    @property({ tooltip: 'Design width, same as Canvas design size.' })
    designWidth: number = 1080;

    @property({ tooltip: 'Design height.' })
    designHeight: number = 1920;

    @property({ tooltip: 'Disable multi-touch for playable ads.' })
    disableMultiTouch: boolean = false;

    @property({ tooltip: 'Log selected fit mode.' })
    debugLog: boolean = true;

    @property({ tooltip: 'Optional Canvas child that should share the visible viewport size.' })
    worldNodeName: string = 'World';

    public static actualWidth: number = 1080;
    public static actualHeight: number = 1920;
    public static isFitHeight: boolean = true;

    private _isApplyingResolution = false;

    protected onLoad(): void {
        macro.ENABLE_MULTI_TOUCH = !this.disableMultiTouch;
        this._applyResolutionPolicy();
        this._syncWorldViewportSize();
    }

    protected onEnable(): void {
        (view as any).on?.('canvas-resize', this._handleCanvasResize, this);
    }

    protected onDisable(): void {
        (view as any).off?.('canvas-resize', this._handleCanvasResize, this);
    }

    protected start(): void {
        this._syncWorldViewportSize();
    }

    private _handleCanvasResize(): void {
        if (this._isApplyingResolution) return;
        this._applyResolutionPolicy();
        this._syncWorldViewportSize();
    }

    private _setDesignResolution(policy: number): void {
        this._isApplyingResolution = true;
        try {
            view.setDesignResolutionSize(this.designWidth, this.designHeight, policy);
        } finally {
            this._isApplyingResolution = false;
        }
    }

    private _applyResolutionPolicy(): void {
        const w = screen.windowSize.width;
        const h = screen.windowSize.height;
        const frameRatio = w / h;
        const designRatio = this.designWidth / this.designHeight;

        if (frameRatio > designRatio) {
            this._setDesignResolution(ResolutionPolicy.FIXED_HEIGHT);
            ResponsiveScreen.isFitHeight = true;
            ResponsiveScreen.actualWidth = (this.designWidth * frameRatio) / designRatio;
            ResponsiveScreen.actualHeight = this.designHeight;
        } else {
            this._setDesignResolution(ResolutionPolicy.FIXED_WIDTH);
            ResponsiveScreen.isFitHeight = false;
            ResponsiveScreen.actualWidth = this.designWidth;
            ResponsiveScreen.actualHeight = (this.designHeight * designRatio) / frameRatio;
        }

        if (this.debugLog) {
            console.log(`[ResponsiveScreen] ${ResponsiveScreen.isFitHeight ? 'FIT_HEIGHT' : 'FIT_WIDTH'}`, {
                actualWidth: ResponsiveScreen.actualWidth,
                actualHeight: ResponsiveScreen.actualHeight,
                frameRatio,
                designRatio,
            });
        }
    }

    private _syncWorldViewportSize(): void {
        if (!this.worldNodeName) return;

        const world = this.node.getChildByName(this.worldNodeName);
        const transform = world?.getComponent(UITransform);
        if (!transform) return;

        transform.setContentSize(ResponsiveScreen.actualWidth, ResponsiveScreen.actualHeight);
    }
}