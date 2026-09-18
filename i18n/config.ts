/**
 * Limbile aplicației.
 * Româna este limba principală: toate textele se scriu întâi în messages/ro.json.
 * Engleza și olandeza au aceeași structură de chei; traducerea completă este o etapă separată.
 */
export const locales = ["ro", "en", "nl"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ro";

export const LOCALE_COOKIE = "locale";

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (locales as readonly string[]).includes(value)
  );
}
