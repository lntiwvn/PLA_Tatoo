import { Iterator } from './Iterator';

export class ConcreteIterator<T> implements Iterator<T> {
    private collection: T[];
    private position: number = 0;

    constructor(collection: T[]) {
        this.collection = collection;
    }

    next(): T | null {
        if (this.hasNext()) {
            return this.collection[this.position++];
        }
        return null;
    }

    hasNext(): boolean {
        return this.position < this.collection.length;
    }

    prev(): T | null {
        if (this.hasPrev()) {
            return this.collection[--this.position];
        }
        return null;
    }

    hasPrev(): boolean {
        return this.position > 0;
    }

    goto(position: number): T | null {
        if (position >= 0 && position < this.collection.length) {
            this.position = position;
            return this.collection[this.position];
        }
        return null;
    }

    getCurrentPosition() {
        return this.position;
    }
}
