declare global {
    interface Window {
        tattoContext: TattoContext; // Bạn có thể thay 'any' bằng kiểu dữ liệu cụ thể hơn nếu biết
    }
}

import {
    _decorator,
    Component,
    Vec3,
    Node,
    UIOpacity,
    randomRangeInt,
    ParticleSystem,
    sp,
    Prefab,
    instantiate,
    Sprite,
    SpriteFrame,
    Input,
} from 'cc';
import { Constant } from '../../../constant/constant';
import { AudioManager } from '../../../PLAGameFoundation/gameControl/utilities/framework/audioManager';
import { FoamContext } from '../FoamContext';
import { ConcreteAggregate } from '../Iterator/ConcreteAggregate';
import { TattooSticker } from '../TattooSticker';
import { Iterator } from '../Iterator/Iterator';
import gameEndHandler from '../../../PLAGameFoundation/gameControl/utilities/handler/gameEndHandler';
import { TrackingManager } from '../EventTracking/TrackingManager';

const { ccclass, property } = _decorator;

@ccclass('TattoContext')
export class TattoContext extends Component {
    @property(ParticleSystem)
    drawVfxParticle: ParticleSystem = null;
    @property(Node)
    handTutorial: Node = null;
    @property(Node)
    textTutorial: Node = null;
    @property(Node)
    playMoreButton: Node = null;

    @property([SpriteFrame])
    samples: SpriteFrame[] = [];
    @property([Prefab])
    tattooItemPrefab: Prefab[] = [];

    @property(Node)
    tattooStickerLayer: Node = null;

    @property(Sprite)
    sampleSprite: Sprite = null;

    @property(FoamContext)
    foarmContext: FoamContext = null;

    @property({
        type: Node,
        group: 'Tattoo machine',
    })
    tattoMachine: Node = null;
    @property({
        type: UIOpacity,
        group: 'Tattoo machine',
    })
    tattoMachineOpacity: UIOpacity = null;
    @property({
        type: Node,
        group: 'Tattoo line machine',
    })
    tattoLineMachine: Node = null;
    @property({
        type: UIOpacity,
        group: 'Tattoo line machine',
    })
    tattoLineMachineOpacity: UIOpacity = null;

    //Confetti
    @property({
        type: ParticleSystem,
        group: 'Confetti',
    })
    confettiParticleLeft: ParticleSystem = null;
    @property({
        type: ParticleSystem,
        group: 'Confetti',
    })
    confettiParticleRight: ParticleSystem = null;
    @property({
        type: ParticleSystem,
        group: 'Confetti',
    })
    confettiParticleTop: ParticleSystem = null;
    @property({
        type: sp.Skeleton,
        group: 'Confetti',
    })
    textWowSpine: sp.Skeleton = null;

    // property

    stickerAggregate: ConcreteAggregate<TattooSticker>;
    stickerIterator: Iterator<TattooSticker>;
    currentSticker: TattooSticker;
    tattooStickers: TattooSticker[] = [];

    textSkins = ['Good', 'Great', 'Perfect'];

    audioManager: AudioManager = new AudioManager();

    stickerTattoIndex: number = -1;

    isFirstTouch: boolean;

     trackingManager: TrackingManager;

    protected onLoad(): void {
        window.tattoContext = this;
        this.isFirstTouch = true;
        this.textTutorial.active = false;
        this.handTutorial.active = false;
        this.playMoreButton.active = false;
    }

    start() {
        this.node.on(Input.EventType.TOUCH_START, this.onFirstTouch, this);
        this.audioManager.init();
        this.init();
        this.onIntro();
    }

    init() {
        this.tattoMachineOpacity.opacity = 0;
        this.tattoLineMachineOpacity.opacity = 0;
    }

    onIntro() {
        this.onPlay();
    }

    onPlay() { }

    loadAllStickerPlay(stickersIndex: number[]) {
        stickersIndex.forEach((itemIndex) => {
            this.loadTattooSticker(itemIndex);
        });
        this.stickerAggregate = new ConcreteAggregate<TattooSticker>();
        this.stickerAggregate.addItem(this.tattooStickers);
        this.stickerIterator = this.stickerAggregate.createIterator();
    }

    playNextSticker() {
        this.currentSticker = this.stickerIterator.next();
        if (this.currentSticker) {
            this.currentSticker.showNextPatch();
        } else {
            // console.log('done all sticker');
            this.showConfetti();
            this.playMoreButton.active = true;
        }
    }

    loadTattooSticker(itemIndex: number) {
        let tattooNode = instantiate(this.tattooItemPrefab[itemIndex]);
        tattooNode.parent = this.tattooStickerLayer;
        let tattooSticker = tattooNode.getComponent(TattooSticker);
        tattooSticker.init();
        this.tattooStickers.push(tattooSticker);
    }

    onOutro() { }

    setTattooMachinePos(newPos: Vec3) {
        this.tattoMachine.setPosition(newPos);
    }

    setTattooLineMachinePos(newPos: Vec3) {
        this.tattoLineMachine.setPosition(newPos);
    }

    showTextWow() {
        // console.log('showTextWow');
        this.audioManager.stopAll();
        this.audioManager.playMusic(Constant.EFFECT_NAME.WOW, false);
        let textRandom = this.textSkins[randomRangeInt(0, this.textSkins.length)];
        this.textWowSpine.setSkin(textRandom);
        this.textWowSpine.clearTrack(0);
        this.textWowSpine.setAnimation(0, 'animation', false);

    }

    showConfetti() {
        this.confettiParticleLeft.stop();
        this.confettiParticleRight.stop();
        this.confettiParticleTop.stop();

        this.confettiParticleLeft.play();
        this.confettiParticleRight.play();
        this.confettiParticleTop.play();
        this.audioManager.playMusic(Constant.EFFECT_NAME.WOW, false);
    }

    onCurrentStickerDone() {
        // this.foarmContext.init();
        this.foarmContext.startFillFoam();
    }

    onCurrentStickerFillFoamDone() {
        this.foarmContext.startClearFoam();
    }

    onCurrentStickerClearFoamDone() {
        this.showConfetti();
        this.playMoreButton.active = true;
    }

    onShowNextPatchDone(patchIndex: number) { }

    onFirstTouch() {
        this.isFirstTouch = false
        this.handTutorial.active = false;
        this.textTutorial.active = false;
    }

    onClickPlayMore() {
        gameEndHandler.StoreGameChangingNoCondition();
    }
}
