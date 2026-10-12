import { describe, it, expect, vi } from "vitest";
import { findAvailableSlug } from "../steps/find-available-slug";
import { checkSlugDb } from "../../check-slug-availability/steps/check-slug-db";
import { RESERVED_WORKSPACE_SLUGS, RESERVED_SLUGS } from "@/shared/config/limits";
import type { ServiceContext } from "@/graphql/types";
import type { PrismaClient } from "@prisma/client";

vi.mock("../../check-slug-availability", () => ({
  checkSlugAvailability: vi.fn().mockImplementation(async ({ slug }) => {
    // Return available: true for non-reserved slugs
    return { available: true };
  }),
}));

describe("findAvailableSlug — reserved slug handling", () => {
  it("rejects custom slug if it is in RESERVED_WORKSPACE_SLUGS", async () => {
    const mockCtx = {} as ServiceContext;

    await expect(
      findAvailableSlug("user-1", "Admin User", "admin", mockCtx)
    ).rejects.toThrow("The slug 'admin' is reserved. Please choose another.");
  });

  it("skips reserved slug during auto-generation and returns suffixed variant", async () => {
    // For auto-generation with a name like 'Home User', attempt 0 candidate is 'home' (reserved).
    // It should skip attempt 0 and attempt 1 produces 'home-xxxx'.
    const mockCtx = {} as ServiceContext;

    const result = await findAvailableSlug("user-1", "Home", undefined, mockCtx);

    expect(result).toMatch(/^home-[a-z0-9]{4}$/);
    expect((RESERVED_WORKSPACE_SLUGS as readonly string[]).includes(result)).toBe(false);
  });

  it("returns clean sanitized slug directly when not reserved and available", async () => {
    const mockCtx = {} as ServiceContext;

    const result = await findAvailableSlug("user-1", "Jane Doe", undefined, mockCtx);

    expect(result).toBe("jane-doe");
  });
});

describe("checkSlugDb — reserved slug enforcement", () => {
  it("identifies reserved slugs as already taken without querying database", async () => {
    const mockDb = {
      workspace: {
        findUnique: vi.fn(),
      },
    } as unknown as PrismaClient;

    const isReservedTaken = await checkSlugDb("app", mockDb);
    expect(isReservedTaken).toBe(true);
    expect(mockDb.workspace.findUnique).not.toHaveBeenCalled();

    const isWorkspaceTaken = await checkSlugDb("workspace", mockDb);
    expect(isWorkspaceTaken).toBe(true);
    expect(mockDb.workspace.findUnique).not.toHaveBeenCalled();
  });

  it("queries database for normal non-reserved slugs", async () => {
    const mockDb = {
      workspace: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaClient;

    const isTaken = await checkSlugDb("my-team", mockDb);
    expect(isTaken).toBe(false);
    expect(mockDb.workspace.findUnique).toHaveBeenCalledWith({
      where: { slug: "my-team" },
      select: { id: true },
    });
  });
});
