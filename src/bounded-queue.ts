
export class BoundedQueue<T> {
  private items: T[] = [];
  private readers: Array<(value: T | null) => void> = [];
  private writers: Array<() => void> = [];
  private closed = false;

  constructor(private capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new Error("Neteisinga eilės talpa");
    }
  }

  async push(item: T): Promise<void> {
    while (this.items.length >= this.capacity) {
      if (this.closed) throw new Error("Eilė uždaryta");

      await new Promise<void>(resolve => {
        this.writers.push(resolve);
      });
    }

    if (this.closed) throw new Error("Eilė uždaryta");

    const reader = this.readers.shift();

    if (reader) {
      reader(item);
    } else {
      this.items.push(item);
    }
  }

  async pop(): Promise<T | null> {
    const item = this.items.shift();

    if (item !== undefined) {
      this.writers.shift()?.();
      return item;
    }

    if (this.closed) return null;

    return new Promise(resolve => this.readers.push(resolve));
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;

    for (const reader of this.readers) reader(null);
    for (const writer of this.writers) writer();

    this.readers = [];
    this.writers = [];
  }

  get size(): number {
    return this.items.length;
  }
}
