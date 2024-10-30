import { _decorator } from 'cc';
import { TattoContext } from './TattoContext';
import { TrackingManager } from '../EventTracking/TrackingManager';
import { GoogleAnalyticsTracker } from '../EventTracking/Trackers/GoogleAnalyticsTracker';
const { ccclass, property } = _decorator;

@ccclass('TatooContext3')
export class TatooContext3 extends TattoContext {
    protected onLoad(): void {
        this.trackingManager = new TrackingManager();
        this.trackingManager.addTracker(new GoogleAnalyticsTracker('G-NY24GPNB62'), 'Google_Analytics');
        this.trackingManager.mapEventsToTrackers([
            'pl43_game_start',
            'pl43_game_step_1_end',
            'pl43_game_step_2_loaded',
            'pl43_game_step_2_play',
            'pl43_game_step_3_play',
            'pl43_game_step_4_play',
            'pl43_game_step_5_play',
            'pl43_game_step_6_play',
            'pl43_game_step_cta_click',
            'pl43_game_step_result',
            'pl43_home_click',
            'pl43_home_loaded'
        ], ['Google_Analytics']);

        super.onLoad();
    }

    start(): void {
        super.start();
        this.trackingManager.trackEvent('pl43_home_loaded');
    }

    onPlay(): void {
        let stickerIndexPlay = [0];
        this.loadAllStickerPlay(stickerIndexPlay);
        this.playNextSticker();
    }

    onShowNextPatchDone(patchIndex: number): void {
        if (patchIndex === 0) {
            this.handTutorial.active = true;
            this.textTutorial.active = true;
        }
    }

    onCurrentStickerClearFoamDone(): void {
        this.trackingManager.trackEvent('pl43_game_step_result');
        super.onCurrentStickerClearFoamDone();
    }

    onFirstTouch(): void {
        if (this.isFirstTouch) {
            this.trackingManager.trackEvent('pl43_home_click');
        }
        super.onFirstTouch();
    }

    onClickPlayMore(): void {
        window.tattoContext.trackingManager.trackEvent('pl43_game_step_cta_click');
        super.onClickPlayMore();
    }
}
