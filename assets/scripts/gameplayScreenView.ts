import { _decorator, UIRenderer } from "cc";
import { BaseScreenWithoutParams } from "../PLAGameFoundation/ui/base/baseScreen";
const { ccclass } = _decorator;

@ccclass("GameplayScreenView")
export class GameplayScreenView extends BaseScreenWithoutParams {

    private presenter: GameplayScreenPresenter = new GameplayScreenPresenter(this);

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

class GameplayScreenPresenter {

    private view: GameplayScreenView;

    public constructor(view: GameplayScreenView) {
        this.view = view;
    }

    onInit(): void {
        console.log("GameplayScreenPresenter.onInit");
    }
    onShow(): void {
        console.log("GameplayScreenPresenter.onShow");
    }
    onHide(): void {
        console.log("GameplayScreenPresenter.onHide");
    }
}