/**
 * Bani ca numere ÎNTREGI în unități minime (bani / cenți). Niciodată zecimale flotante.
 * Regula din docs/plan.md: rotunjire „half up” o singură dată, la linie, nu la total.
 */

/** Sumă în unități minime: 12,34 lei = 1234. */
export type Minor = number;

function assertNonNegativeInt(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(
      `${name} trebuie să fie un întreg ≥ 0, am primit: ${value}`,
    );
  }
}

/**
 * Împărțire de întregi nenegativi cu rotunjire „half up” (exact jumătate urcă).
 * Lucrează doar cu întregi, deci nu apar erori de virgulă mobilă (ex. 1.005 * 100).
 */
export function divRoundHalfUp(numerator: number, denominator: number): number {
  assertNonNegativeInt(numerator, "numărătorul");
  assertNonNegativeInt(denominator, "numitorul");
  if (denominator === 0) throw new RangeError("împărțire la zero");
  const doubled = 2 * numerator + denominator;
  if (!Number.isSafeInteger(doubled)) throw new RangeError("sumă prea mare");
  return Math.floor(doubled / (2 * denominator));
}

/** Înmulțire de întregi care refuză rezultatele prea mari pentru a rămâne exacte. */
function mulExact(a: number, b: number): number {
  const product = a * b;
  if (!Number.isSafeInteger(product)) throw new RangeError("sumă prea mare");
  return product;
}

/** Costul unei înregistrări de ore: minute × tarif orar / 60, rotunjit la ban. */
export function timeCost(minutes: number, hourlyRate: Minor): Minor {
  assertNonNegativeInt(minutes, "minutele");
  assertNonNegativeInt(hourlyRate, "tariful orar");
  return divRoundHalfUp(mulExact(minutes, hourlyRate), 60);
}

/**
 * Totalul unei linii de cost: cantitate × preț unitar, rotunjit la ban.
 * Cantitatea este în miimi (2,5 m² = 2500), ca să rămână număr întreg.
 */
export function lineTotal(quantityMilli: number, unitPrice: Minor): Minor {
  assertNonNegativeInt(quantityMilli, "cantitatea");
  assertNonNegativeInt(unitPrice, "prețul unitar");
  return divRoundHalfUp(mulExact(quantityMilli, unitPrice), 1000);
}

export interface VatBreakdown {
  net: Minor;
  vat: Minor;
  gross: Minor;
}

/**
 * „Preț fără TVA + TVA X% = total”. Cota este în puncte de bază (19% = 1900) și vine
 * din setările firmei / versiunea propunerii; aici nu există nicio cotă scrisă în cod.
 */
export function vatBreakdown(net: Minor, vatRateBp: number): VatBreakdown {
  assertNonNegativeInt(net, "prețul fără TVA");
  assertNonNegativeInt(vatRateBp, "cota TVA");
  const vat = divRoundHalfUp(mulExact(net, vatRateBp), 10_000);
  return { net, vat, gross: net + vat };
}

export function sumMinor(amounts: readonly Minor[]): Minor {
  return amounts.reduce((total, amount) => total + amount, 0);
}
