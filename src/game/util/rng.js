export class RNG {
  constructor(seed = 123456789) { this.seed = seed >>> 0; }
  next() {
    let x = this.seed;
    x ^= x << 13; x >>>= 0;
    x ^= x >> 17; x >>>= 0;
    x ^= x << 5;  x >>>= 0;
    this.seed = x;
    return x / 0xFFFFFFFF;
  }
  range(min, max) { return min + (max - min) * this.next(); }
  int(min, max) { return Math.floor(this.range(min, max + 1)); }
}
