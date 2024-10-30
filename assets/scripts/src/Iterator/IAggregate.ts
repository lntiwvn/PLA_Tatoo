import { Iterator } from "./Iterator";

export interface Aggregate<T> {
    createIterator(): Iterator<T>;
}
