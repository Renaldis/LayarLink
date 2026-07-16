import { expect, it } from "vitest";
import { createPublicId, getExpiresAt, rotatePublicId } from "@/lib/videos";

it("snapshots expiry from the retention setting", () => {
  expect(getExpiresAt(new Date("2026-07-16T00:00:00.000Z"), 30).toISOString()).toBe("2026-08-15T00:00:00.000Z");
});

it("rotates a public identifier when publishing again", () => {
  expect(rotatePublicId(createPublicId())).not.toBe(createPublicId());
});
