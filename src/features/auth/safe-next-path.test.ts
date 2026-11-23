import { expect, it } from "vitest";
import { safeNextPath } from "./safe-next-path";

it.each([
  ["/dashboard", "/dashboard"],
  ["/transactions?month=2026-11", "/transactions?month=2026-11"],
  ["//evil.com", "/dashboard"],
  ["https://evil.com", "/dashboard"],
  ["/\\evil.com", "/dashboard"],
  ["/\\/evil.com", "/dashboard"],
  ["/%09/evil.com", "/%09/evil.com"], // codificado: continua um caminho interno
  ["/\t/evil.com", "/dashboard"],
  ["/categories\\..\\x", "/dashboard"],
  [undefined, "/dashboard"],
])("safeNextPath(%s) → %s", (input, expected) => expect(safeNextPath(input)).toBe(expected));
