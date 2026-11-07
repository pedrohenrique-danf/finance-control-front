import { expect, it } from "vitest";
import { safeNextPath } from "./safe-next-path";

it.each([
  ["/dashboard", "/dashboard"],
  ["/transactions?month=2026-11", "/transactions?month=2026-11"],
  ["//evil.com", "/dashboard"],
  ["https://evil.com", "/dashboard"],
  [undefined, "/dashboard"],
])("safeNextPath(%s) → %s", (input, expected) => expect(safeNextPath(input)).toBe(expected));
