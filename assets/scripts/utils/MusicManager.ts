import { _decorator, Component, Node, AudioSource, Enum } from "cc";
import { AudioClip } from "cc";
import { resourceUtil } from "./resourceUtil";
import { warn } from "cc";
const { ccclass, property } = _decorator;

@ccclass("MusicManager")
export class MusicManager extends Component {
    public static instance: MusicManager;
    @property(AudioSource)
    audioSource: AudioSource = null!;

    mapAudioClips: Map<MUSIC_NAME, AudioClip> = new Map<MUSIC_NAME, AudioClip>();
    private _audioUnlocked: boolean = false;

    onLoad() {
        // director.addPersistRootNode(this.node);
        this.audioSource = this.node.getComponent(AudioSource);
        if (this.audioSource) {
            this.audioSource.playOnAwake = false;
        }
        MusicManager.instance = this;
    }

    start() {
        // Playable ads defer the music bundle until the first user interaction.
    }

    public unlockAudioByUserInteraction() {
        if (this._audioUnlocked) return;
        this._audioUnlocked = true;
        this.loadMusic(MUSIC_NAME.INGAME);
    }

    preloadMusic(music_name: MUSIC_NAME) {
        const path = "audios/music/";
        const name = music_name;
        if (this.mapAudioClips.has(name)) return;

        resourceUtil.loadAudioClip(path + name, (err, clip) => {
            if (err) {
                warn("preload music failed: ", err);
                return;
            }
            this.mapAudioClips.set(name, clip);
        });
    }

    loadMusic(music_name: MUSIC_NAME) {
        // if(!localConfig.instance.isMusic) return;
        let path = "audios/music/";
        let name = music_name;
        if (this.mapAudioClips.has(name)) {
            let clip = this.mapAudioClips.get(name);
            if (!this.audioSource || !clip) return;
            this.audioSource.clip = clip;
            // this.audioSource.play();
            this.initMusic();
            return;
        }

        resourceUtil.loadAudioClip(path + name, (err, clip) => {
            if (err) {
                warn("load audioClip failed: ", err);
                //////console.log(path + name);
                return;
            }
            this.mapAudioClips.set(music_name, clip);
            if (!this.audioSource || !clip) return;
            this.audioSource.clip = clip;
            // this.audioSource.play();
            // console.log(this.mapAudioClips);
            this.initMusic();
        });
    }

    initMusic() {
        this.openMusic();
    }

    // update (deltaTime: number) {
    //     // [4]
    // }

    openMusic() {
        if (!this.audioSource) return;
        //////console.log("openMusicopenMusicopenMusicopenMusic");
        // this.setMusicVolume(0.8);
        this.audioSource.volume = 0.8;
        this.audioSource.loop = true;
        if (!this.audioSource.playing) {
            this.audioSource.play();
        }
    }

    checkMusicPlaying() {
        return !!this.audioSource?.playing;
    }

    closeMusic() {
        if (!this.audioSource) return;
        //////console.log("closeMusiccloseMusiccloseMusic");
        // this.setMusicVolume(0);
        this.audioSource.volume = 0;
        if (this.audioSource.playing) {
            this.audioSource.stop();
        }
    }

    pauseMusic() {
        if (!this.audioSource) return;
        if (this.audioSource.playing) {
            this.audioSource.pause();
        }
    }

    resumeMusic() {
        this.openMusic();
    }
}

export enum MUSIC_NAME {
    MENU = "Background_Menu",
    INGAME = "bgm",
}
Enum(MUSIC_NAME);

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
