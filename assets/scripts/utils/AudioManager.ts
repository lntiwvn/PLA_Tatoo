
import { _decorator, Component, Node, AudioSource, AudioClip, warn } from 'cc';
import { resourceUtil } from './resourceUtil';
import { director } from 'cc';
const { ccclass, property } = _decorator;

// Keep this optional component distinct from the framework AudioManager.
// Cocos registers every @ccclass in the project, including scripts that are
// not attached to the active scene, so sharing the same class name prevents
// the scene from reloading correctly.
@ccclass('UtilityAudioManager')
export class AudioManager extends Component {
    public static instance: AudioManager;
    @property(AudioSource)
    audioSource: AudioSource = null!;

    mapAudioClips:Map<SOUND_NAME,AudioClip> = new Map<SOUND_NAME,AudioClip>();
    private _audioUnlocked: boolean = false;
    private _loopSoundName: SOUND_NAME | null = null;
    private _loopSoundRequest = 0;


    onLoad(){
        director.addPersistRootNode(this.node);
        this.audioSource = this.node.getComponent(AudioSource);
        if (this.audioSource) {
            this.audioSource.playOnAwake = false;
            this.audioSource.loop = false;
        }
        AudioManager.instance = this;
    }

    start() {
        // this.playSound(SOUND_NAME.BGM)
        // this.scheduleOnce(() => {
        //     this.preloadSounds([
        //         SOUND_NAME.COMBO1,  SOUND_NAME.COMBO2,  SOUND_NAME.COMBO3,
        //         SOUND_NAME.COMBO4,  SOUND_NAME.COMBO5,  SOUND_NAME.COMBO6,
        //         SOUND_NAME.COMBO7,  SOUND_NAME.COMBO8,  SOUND_NAME.COMBO9,
        //         SOUND_NAME.COMBO10, SOUND_NAME.COMBO11, SOUND_NAME.COMBO12,
        //     ]);
        // }, 0.5);
        // // [3]
    }

    public unlockAudioByUserInteraction() {
        this._audioUnlocked = true;
    }

    // update (deltaTime: number) {
    //     // [4]
    // }

    /**
     * Nạp trước (và cache) các audio clip để lần phát đầu tiên không bị delay load.
     * Mặc định preload toàn bộ sound trong game (chỉ vài clip nhỏ).
     */
    preloadSounds (names: SOUND_NAME[] = [
        // SOUND_NAME.UI_TOUCH,
        SOUND_NAME.CLICK_ARROW_1,
        SOUND_NAME.CLICK_ARROW_2,
        SOUND_NAME.CAT_1,
        SOUND_NAME.CAT_2,
        SOUND_NAME.CAT_3,
        SOUND_NAME.CAT_4,
        SOUND_NAME.CAT_5,
        SOUND_NAME.CLICK_ARROW_WRONG,
        SOUND_NAME.SCREEN_TRANSITION_CLOSE,
        SOUND_NAME.SCREEN_TRANSITION_OPEN,
        SOUND_NAME.WHOOSH_WIND,
        SOUND_NAME.BLINK,
        SOUND_NAME.WIN_LEVEL,
        SOUND_NAME.LOSE,
        SOUND_NAME.CONFETTI,
        SOUND_NAME.ALERT_TIMEOUT,
        SOUND_NAME.UNLOCK_THE_DOOR,
    ]) {
        const path = 'audios/sound/';
        for (const name of names) {
            if (this.mapAudioClips.has(name)) continue;
            resourceUtil.loadAudioClip(path + name, (err, clip) => {
                if (err) {
                    warn('preload audioClip failed: ', name, err);
                    return;
                }
                this.mapAudioClips.set(name, clip);
            });
        }
    }

    playSound (sound_name:SOUND_NAME, volume: number = 1) {
        if (!this.audioSource) return;

        let path = 'audios/sound/';
        let name = sound_name;
        if(this.mapAudioClips.has(name)){
            let clip = this.mapAudioClips.get(name);
            if (clip) this.audioSource.playOneShot(clip, volume);
            return;
        }

        resourceUtil.loadAudioClip(path + name, (err, clip)=> {
            if (err) {
                warn('load audioClip failed: ', err);
                //////console.log(path + name);
                return;
            }
            this.mapAudioClips.set(sound_name,clip);
            // NOTE: the second parameter is volume scale.
            if (clip) this.audioSource.playOneShot(clip, volume);
        });
    }

    playLoopSound (soundName: SOUND_NAME, volume: number = 1) {
        if (!this.audioSource) return;
        if (this._loopSoundName === soundName && this.audioSource.loop && this.audioSource.playing) return;

        this.stopLoopSound();
        this._loopSoundName = soundName;
        const request = ++this._loopSoundRequest;
        const playClip = (clip: AudioClip | null | undefined) => {
            if (!clip || request !== this._loopSoundRequest || this._loopSoundName !== soundName || !this.audioSource) return;
            this.audioSource.clip = clip;
            this.audioSource.loop = true;
            this.audioSource.volume = volume;
            this.audioSource.play();
        };

        const cachedClip = this.mapAudioClips.get(soundName);
        if (cachedClip) {
            playClip(cachedClip);
            return;
        }

        resourceUtil.loadAudioClip('audios/sound/' + soundName, (err, clip) => {
            if (err || !clip) {
                warn('load loop audioClip failed: ', soundName, err);
                return;
            }
            this.mapAudioClips.set(soundName, clip);
            playClip(clip);
        });
    }

    stopLoopSound (soundName?: SOUND_NAME) {
        if (soundName && this._loopSoundName !== soundName) return;
        this._loopSoundName = null;
        this._loopSoundRequest++;
        if (!this.audioSource || !this.audioSource.loop) return;
        this.audioSource.stop();
        this.audioSource.loop = false;
        this.audioSource.clip = null;
    }


    // isSoundBreak:boolean = false;

    // playSoundIceBreak(){
    //     if(!localConfig.instance.isSound) return;
    //     if(this.isSoundBreak) return;
    //     this.isSoundBreak = true;
    //     this.playSound(SOUND_NAME.ICE_BREAK);
    //     this.scheduleOnce(() => {
    //         this.isSoundBreak = false;
    //     }, 0.1);




    // }

}

export enum SOUND_NAME {
    // UI_TOUCH = 'Click',
    // CLICK = 'Click',
    CLICK_ARROW_1 = 'Click_Arrow_1',
    CLICK_ARROW_2 = 'Click_Arrow_2',
    CAT_1 = 'cat_1',
    CAT_2 = 'cat_2',
    CAT_3 = 'cat_3',
    CAT_4 = 'cat_4',
    CAT_5 = 'cat_5',
    CLICK_ARROW_WRONG = 'Tile_MovementBlocked',
    ARROW_HIT = 'Arrow_Hit',
    TILE_MOVE = 'Tile_Move',
    TILE_MOVEMENT_BLOCKED = 'Tile_MovementBlocked',
    SCREEN_TRANSITION_CLOSE = 'Screen_Transition_Close',
    SCREEN_TRANSITION_OPEN = 'Screen_Transition_Open',
    WHOOSH_WIND = 'whoosh-wind',
    BLINK = 'blink',
    WIN_LEVEL = 'Win Sound',
    LOSE = 'Lose Sound',
    CONFETTI = 'Win Sound',
    COIN_FLY = 'Coin_Fly',
    FALSE_LEVEL = 'False_Level',
    FREEZE = 'Freeze',
    OPEN_CHEST = 'Open Chest',
    REWARD = 'Reward',
    PET = 'Pet',
    ALERT_TIMEOUT = 'Alert_TimeOut',
    UNLOCK_THE_DOOR = 'unlock-the-door',
}

/**
 * [1] Class member could be defined like this.
 * [2] Use `property` decorator if your want the member to be serializable.
 * [3] Your initialization goes here.
 * [4] Your update function goes here.
 *
 * Learn more about scripting: https://docs.cocos.com/creator/3.0/manual/en/scripting/
 * Learn more about CCClass: https://docs.cocos.com/creator/3.0/manual/en/scripting/ccclass.html
 * Learn more about life-cycle callbacks: https://docs.cocos.com/creator/3.0/manual/en/scripting/life-cycle-callbacks.html
 */
