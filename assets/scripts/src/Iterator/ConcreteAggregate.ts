import { ConcreteIterator } from './ConcreteIterator';
import { Aggregate } from './IAggregate';
import { Iterator } from './Iterator';

export class ConcreteAggregate<T> implements Aggregate<T> {
     collection: T[] = [];

    addItem(items: T[]): void {
        this.collection.push(...items);
    }

    createIterator(): Iterator<T> {
        return new ConcreteIterator(this.collection);
    }
}
