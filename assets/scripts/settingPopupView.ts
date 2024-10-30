import { _decorator } from "cc";
import { BasePopupWithoutParams } from "../PLAGameFoundation/ui/base/basePopup";
const { ccclass } = _decorator;

@ccclass("SettingPopupView")
export class SettingPopupView extends BasePopupWithoutParams {

    private presenter: SettingPopupPresenter = new SettingPopupPresenter(this);

    onInit(): void {
        this.presenter.onInit();
    }

    onShow(): void {
        this.presenter.onShow();
    }

    onHide(): void {
        this.presenter.onHide();
    }

}

class SettingPopupPresenter {

    private view: SettingPopupView;

    public constructor(view: SettingPopupView) {
        this.view = view;
    }

    onInit(): void {
        console.log("SettingPopupPresenter.onInit");
    }
    onShow(): void {
        console.log("SettingPopupPresenter.onShow");
    }
    onHide(): void {
        console.log("SettingPopupPresenter.onHide");
    }
}