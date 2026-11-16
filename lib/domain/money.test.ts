import { describe, expect, it } from "vitest";
import {
  divRoundHalfUp,
  lineTotal,
  sumMinor,
  timeCost,
  vatBreakdown,
} from "./money";

describe("rotunjire half up", () => {
  it("exact jumătate urcă, sub jumătate coboară", () => {
    expect(divRoundHalfUp(5, 10)).toBe(1); // 0,5 → 1
    expect(divRoundHalfUp(4, 10)).toBe(0);
    expect(divRoundHalfUp(15, 10)).toBe(2); // 1,5 → 2
    expect(divRoundHalfUp(25, 10)).toBe(3); // 2,5 → 3 (nu „bancher”, care ar da 2)
  });

  it("refuză valori negative, zecimale sau împărțirea la zero", () => {
    expect(() => divRoundHalfUp(-1, 10)).toThrow(RangeError);
    expect(() => divRoundHalfUp(1.5, 10)).toThrow(RangeError);
    expect(() => divRoundHalfUp(1, 0)).toThrow(RangeError);
    expect(() => timeCost(Number.MAX_SAFE_INTEGER, 2)).toThrow(RangeError);
  });
});

describe("costul orelor", () => {
  it("7,5 ore × 45,00 lei = 337,50 lei", () => {
    expect(timeCost(450, 4500)).toBe(33750);
  });

  it("rotunjește la ban o singură dată, pe linie", () => {
    // 20 min × 33,33 lei/oră = 11,11 lei exact; 10 min × 33,33 = 5,555 → 5,56
    expect(timeCost(20, 3333)).toBe(1111);
    expect(timeCost(10, 3333)).toBe(556);
  });

  it("rotunjirea pe linie diferă de rotunjirea la total (și linia e regula)", () => {
    const lines = [timeCost(10, 3333), timeCost(10, 3333), timeCost(10, 3333)];
    expect(sumMinor(lines)).toBe(1668); // 3 × 5,56
    expect(timeCost(30, 3333)).toBe(1667); // dacă s-ar rotunji la total
  });
});

describe("linii de cost și TVA", () => {
  it("cantitate zecimală × preț unitar", () => {
    expect(lineTotal(2500, 1999)).toBe(4998); // 2,5 × 19,99 = 49,975 → 49,98
    expect(lineTotal(1000, 12345)).toBe(12345);
  });

  it("evită eroarea clasică de virgulă mobilă (1,005 × 100)", () => {
    expect(lineTotal(1005, 100)).toBe(101); // 1,005 lei → 1,01; cu float ar ieși 1,00
  });

  it("preț fără TVA + TVA = total, cu cota primită ca parametru", () => {
    expect(vatBreakdown(10000, 1900)).toEqual({
      net: 10000,
      vat: 1900,
      gross: 11900,
    });
    expect(vatBreakdown(333, 2100)).toEqual({ net: 333, vat: 70, gross: 403 }); // 69,93 → 70
    expect(vatBreakdown(5000, 0)).toEqual({ net: 5000, vat: 0, gross: 5000 });
  });
});
