class ImageCache {
  private store = new Map<string, Buffer>();
  private totalSize = 0;
  private maxSize: number;

  constructor(maxSizeBytes: number) {
    this.maxSize = maxSizeBytes;
  }

  get(filename: string): Buffer | null {
    return this.store.get(filename) || null;
  }

  set(filename: string, data: Buffer): void {
    // Don't cache if single item exceeds half the max
    if (data.length > this.maxSize / 2) return;

    // Remove existing entry if updating
    if (this.store.has(filename)) {
      this.totalSize -= this.store.get(filename)!.length;
      this.store.delete(filename);
    }

    // Evict oldest entries until we have room
    while (this.totalSize + data.length > this.maxSize && this.store.size > 0) {
      const oldest = this.store.keys().next().value!;
      this.totalSize -= this.store.get(oldest)!.length;
      this.store.delete(oldest);
    }

    this.store.set(filename, data);
    this.totalSize += data.length;
  }
}

export const imageCache = new ImageCache(100 * 1024 * 1024); // 100MB
