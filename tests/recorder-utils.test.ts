import { expect, it } from "vitest";
import { formatDuration, MAX_RECORDING_SECONDS } from "@/lib/recorder-utils";

it("formats recorder elapsed seconds as mm:ss", () => {
  expect(formatDuration(0)).toBe("00:00");
  expect(formatDuration(65)).toBe("01:05");
  expect(formatDuration(MAX_RECORDING_SECONDS)).toBe("10:00");
});
