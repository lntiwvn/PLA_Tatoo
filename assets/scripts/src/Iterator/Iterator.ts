export interface Iterator<T> {
    next(): T | null;
    prev(): T | null;
    goto(position: number): T | null;
    getCurrentPosition(): number;
}
