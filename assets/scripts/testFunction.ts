import {
    _decorator,
    Component,
    EventTouch,
    Input,
    input,
    Node,
    instantiate,
    Vec3,
    Prefab,
    director,
} from "cc";
import { Constant } from "../constant/constant";
import { GameManager } from "../PLAGameFoundation/gameControl/core/manager/gameManager";
import gameEndHandler from "../PLAGameFoundation/gameControl/utilities/handler/gameEndHandler";


const {ccclass, property} = _decorator;

@ccclass("testFunction")
export class testFunction extends Component {

    protected onLoad(): void {
        GameManager.instance.SetupManagerInit();
    }

    protected start(): void {
        input.on(Input.EventType.TOUCH_START, this.OnTouchStart, this);
    }

    private OnTouchStart(event: EventTouch) {
        this.TouchEffect(
            new Vec3(event.getUILocation().x, event.getUILocation().y, 0)
        );
    }

    public TouchEffect(pos: Vec3) {
        GameManager.instance.effectManager.playParticle(Constant.EFFECT_NAME.EFFECT_TEST, pos);
        GameManager.instance.audioManager.playSound(Constant.AUDIO_NAME.SOUND_TEST);
    }

    protected update(dt: number): void {
        gameEndHandler.StoreGameChanging(this.IsChangeToLinkStore());
    }

    public IsChangeToLinkStore(): boolean {
        // This's Win Condition
        return true;
    }
}
