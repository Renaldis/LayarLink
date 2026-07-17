import { expect, it } from "vitest";
import { folderNameSchema } from "@/lib/validation";

it("accepts a concise folder name", () => {
  expect(folderNameSchema.parse("Bug reports")).toBe("Bug reports");
});

it("rejects blank folder names", () => {
  expect(() => folderNameSchema.parse("  ")).toThrow();
});
