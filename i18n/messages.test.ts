import { describe, expect, it } from "vitest";
import ro from "../messages/ro.json";
import en from "../messages/en.json";
import nl from "../messages/nl.json";
import { defaultLocale, locales } from "./config";

type Messages = Record<string, unknown>;

/** Returnează toate cheile unui obiect de traduceri, sub forma "Sectiune.cheie". */
function flattenKeys(obj: Messages, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return flattenKeys(value as Messages, path);
    }
    return [path];
  });
}

describe("traduceri", () => {
  it("româna este limba implicită", () => {
    expect(defaultLocale).toBe("ro");
    expect(locales).toContain("ro");
  });

  it("engleza și olandeza au exact aceleași chei ca româna", () => {
    const roKeys = flattenKeys(ro).sort();
    expect(flattenKeys(en).sort()).toEqual(roKeys);
    expect(flattenKeys(nl).sort()).toEqual(roKeys);
  });

  it("nicio traducere nu are texte goale", () => {
    for (const messages of [ro, en, nl]) {
      for (const key of flattenKeys(messages)) {
        const value = key
          .split(".")
          .reduce<unknown>((acc, part) => (acc as Messages)[part], messages);
        expect(
          typeof value === "string" && value.trim().length > 0,
          `cheie goală: ${key}`,
        ).toBe(true);
      }
    }
  });
});
