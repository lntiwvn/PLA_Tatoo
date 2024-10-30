import { EventMap } from "../EventMap";
import { ITracker } from "../ITracker";

declare global {
    interface Window {
        dataLayer: any[];
    }
}

declare var dataLayer: any[];

export class GoogleAnalyticsTracker implements ITracker {
    _isDebug: boolean = false;

    constructor(id: string, isDebug: boolean = false) {
        this._isDebug = isDebug;
        window.dataLayer = window.dataLayer || [];
        this.gtag('js', new Date());
        if (isDebug) {
            this.gtag('config', id, { 'debug_mode': true });
        } else {
            this.gtag('config', id);
        }
    }

    gtag(..._: any) {
        // console.log('gtag', arguments, dataLayer);
        dataLayer.push(arguments);
    }

    sendEvent(event: EventMap, data?: {}) {
        this.gtag('event', event, data);
    }

    IsDebug(): boolean {
        return this._isDebug;
    }
}