import { EventMap } from "./EventMap";

export interface ITracker {
    _isDebug: boolean;
    sendEvent: (event: EventMap, data?: any) => void;
    IsDebug: () => boolean;
}