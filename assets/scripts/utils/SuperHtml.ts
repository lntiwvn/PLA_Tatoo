import { Component, _decorator, Node } from "cc";
// import { pDecorator, pLogger } from "../../utils";
import { NodeEventType } from "cc";

// const { singleton } = pDecorator;
const { ccclass, property } = _decorator;

@ccclass("SuperHtml")
export class SuperHtml extends Component {
    public static instance: SuperHtml | null = null;

    @property({})
    txtGoogleStore: string = "";

    @property({})
    txtAppleStore: string = "";

    @property(Node)
    nodeGlobal: Node = null;

    protected onLoad(): void {
        if (SuperHtml.instance && SuperHtml.instance !== this) {
            // this.destroy();
            return;
        }
        SuperHtml.instance = this;
        this.setAppleStoreUrl(this.txtAppleStore);
        this.setGooglePlayUrl(this.txtGoogleStore);
        this.nodeGlobal.active = false;
    }

    protected onDestroy(): void {
        if (SuperHtml.instance === this) {
            SuperHtml.instance = null;
        }
    }

    protected _isSetGlobalTouch: boolean = false;
    setGlobalTouch() {
        if (this._isSetGlobalTouch) return;

        this.nodeGlobal.active = true;
        this._isSetGlobalTouch = true;
        this.nodeGlobal?.on(NodeEventType.TOUCH_START, this.actDownload, this);
    }

    actDownload() {
        console.log("download");
        this.setGameEnd();
        //@ts-ignore
        window.super_html && super_html.download();
    }

    protected _isEndGame: boolean = false;
    setGameEnd() {
        if (this._isEndGame) return;
        this._isEndGame = true;

        console.log("game end");
        //@ts-ignore
        window.super_html && super_html.game_end();
    }

    /**
     * 是否隐藏下载按钮，意味着使用平台注入的下载按钮
     * channel : google
     */
    isHideDownload() {
        //@ts-ignore
        if (window.super_html && super_html.is_hide_download) {
            //@ts-ignore
            return super_html.is_hide_download();
        }
        return false;
    }

    /**
     * 设置商店地址
     * channel : unity
     * @param url https://play.google.com/store/apps/details?id=com.unity3d.auicreativetestapp
     */
    setGooglePlayUrl(url: string) {
        //@ts-ignore
        window.super_html && (super_html.google_play_url = url);
    }

    /**
     * 设置商店地址
     * channel : unity
     * @param url https://apps.apple.com/us/app/ad-testing/id1463016906
     */
    setAppleStoreUrl(url: string) {
        //@ts-ignore
        window.super_html && (super_html.appstore_url = url);
    }
    /**
     * 设置商店地址
     * channel : IronSource
     */
    isAudio() {
        //@ts-ignore
        return (window.super_html && super_html.is_audio()) || true;
    }
}
