export function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

export class Rational {
  readonly n: bigint;
  readonly d: bigint;

  private constructor(n: bigint, d: bigint) {
    if (d === 0n) throw new Error("Rational: zero denominator");
    if (d < 0n) { n = -n; d = -d; }
    // d is non-zero here, so gcd(n, d) >= 1 (gcd(0, d) === d); no zero-guard needed.
    const g = gcd(n, d);
    this.n = n / g;
    this.d = d / g;
  }

  static from(n: bigint | number, d: bigint | number = 1n): Rational {
    return new Rational(BigInt(n), BigInt(d));
  }

  mul(o: Rational): Rational { return new Rational(this.n * o.n, this.d * o.d); }
  div(o: Rational): Rational { return new Rational(this.n * o.d, this.d * o.n); }
  add(o: Rational): Rational { return new Rational(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o: Rational): Rational { return new Rational(this.n * o.d - o.n * this.d, this.d * o.d); }
  abs(): Rational { return new Rational(this.n < 0n ? -this.n : this.n, this.d); }

  cmp(o: Rational): -1 | 0 | 1 {
    const l = this.n * o.d, r = o.n * this.d;
    return l < r ? -1 : l > r ? 1 : 0;
  }
  equals(o: Rational): boolean { return this.n === o.n && this.d === o.d; }
  toNumber(): number { return Number(this.n) / Number(this.d); }
  toString(): string { return `${this.n}/${this.d}`; }
}
