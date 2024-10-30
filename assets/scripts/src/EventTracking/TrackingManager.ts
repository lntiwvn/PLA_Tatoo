import { EventMap } from "./EventMap";
import { GroupMap } from "./GroupMap";
import { ITracker } from "./ITracker";

export class TrackingManager {
    trackers: { tracker: ITracker; group: GroupMap; }[];
    eventTrackerMap: { [key: string]: string[]; };


    constructor() {
        this.trackers = [];
        this.eventTrackerMap = {};
    }

    addTracker(tracker: ITracker, group: GroupMap) {
        this.trackers.push({ tracker, group });
    }

    mapEventsToTrackers(event: EventMap[], trackerGroups: GroupMap[]) {
        event.forEach(e => this.mapEventToTrackers(e, trackerGroups));
    }

    mapEventToTrackers(event: EventMap, trackerGroups: GroupMap[]) {
        this.eventTrackerMap[event] = trackerGroups;
    }

    trackEvent(event: EventMap, data?: any) {
        const groups = this.eventTrackerMap[event] || [];
        this.trackers.forEach(({ tracker, group }) => {
            if (groups.length === 0 || groups.indexOf(group) !== -1) {
                tracker.sendEvent(event, tracker.IsDebug() ? { ...data, 'debug_mode': tracker.IsDebug() } : data);
                if (tracker.IsDebug()) {
                    console.warn('Track event debug:', 'Event:', event, 'Data:', data);
                }
            }
        });
    }
}
