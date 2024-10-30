import { _decorator, Component, UI, } from "cc";
import { GameplayScreenView } from "./gameplayScreenView";
import { UIManager } from "../PLAGameFoundation/ui/uiManager";
import { SettingPopupView } from "./settingPopupView";
const { ccclass } = _decorator;

@ccclass("EntryPoint")
export class EntryPoint extends Component {

    protected async start() {
        // console.log("EntryPoint.start before");
        // await UIManager.instance.showViewWithoutParamsAsync(GameplayScreenView);
        // await UIManager.instance.showViewWithoutParamsAsync(SettingPopupView);
        // console.log("EntryPoint.start after");
    }

}