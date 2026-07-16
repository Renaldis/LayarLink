import { describe, expect, it } from "vitest";
import { canDeleteComment, isAdmin } from "@/lib/authz";

describe("authorization", () => {
  it("recognizes only the configured email as admin", () => {
    expect(isAdmin("admin@example.com", "admin@example.com")).toBe(true);
    expect(isAdmin("user@example.com", "admin@example.com")).toBe(false);
  });

  it("allows the author, video owner, or admin to delete a comment", () => {
    expect(canDeleteComment({ actorId: "author", commentAuthorId: "author", videoOwnerId: "owner", admin: false })).toBe(true);
    expect(canDeleteComment({ actorId: "owner", commentAuthorId: "author", videoOwnerId: "owner", admin: false })).toBe(true);
    expect(canDeleteComment({ actorId: "other", commentAuthorId: "author", videoOwnerId: "owner", admin: false })).toBe(false);
  });
});
