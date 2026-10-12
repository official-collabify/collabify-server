import { describe, it, expect, vi, beforeEach } from "vitest";
import { createOnboardingWorkspace } from "../handler";
import { seedDefaultProject } from "../steps/seed-default-project";
import { LockingService } from "@/services/locking";
import { PROJECT_GRANTS } from "../../../../../../prisma/seeds/shared/system-grants";
import type { ServiceContext } from "@/graphql/types";
import type { PrismaClient } from "@prisma/client";

describe("seedDefaultProject — project & defaults seeding", () => {
  it("does not recreate project if 'general' already exists in the workspace", async () => {
    const mockDb = {
      project: {
        findUnique: vi.fn().mockResolvedValue({
          id: "proj-already-exists",
          key: "general",
        }),
      },
    } as unknown as PrismaClient;

    const result = await seedDefaultProject("ws-123", "user-123", mockDb);
    expect(result.id).toBe("proj-already-exists");
    expect(mockDb.project.findUnique).toHaveBeenCalledWith({
      where: {
        workspaceId_key: {
          workspaceId: "ws-123",
          key: "general",
        },
      },
    });
  });

  it("inserts 'general' project and seeds project defaults when project does not exist", async () => {
    const mockProject = {
      id: "proj-new-general",
      key: "general",
      workspaceId: "ws-456",
    };

    // Build permission rows matching PROJECT_GRANTS so insertProject succeeds
    const mockPermissions = PROJECT_GRANTS.map((g, idx) => ({
      id: `perm-${idx}`,
      resource: g.resource,
      action: g.action,
    }));

    const mockDb = {
      $transaction: vi.fn().mockImplementation(async (cb) => {
        const tx = {
          project: {
            findUnique: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue(mockProject),
          },
          role: {
            create: vi.fn().mockImplementation(async ({ data }) => ({
              id: `role-${data.name}`,
              name: data.name,
            })),
          },
          permission: {
            findMany: vi.fn().mockResolvedValue(mockPermissions),
          },
          rolePermission: {
            createMany: vi.fn().mockResolvedValue({ count: mockPermissions.length }),
          },
          projectMember: {
            create: vi.fn().mockResolvedValue({ id: "pm-1" }),
          },
          projectPlugin: {
            createMany: vi.fn().mockResolvedValue({ count: 5 }),
          },
          chatConversation: {
            count: vi.fn().mockResolvedValue(0),
            create: vi.fn().mockResolvedValue({ id: "chat-1" }),
          },
          whiteboard: {
            count: vi.fn().mockResolvedValue(0),
            create: vi.fn().mockResolvedValue({ id: "wb-1" }),
          },
          issueStatus: {
            count: vi.fn().mockResolvedValue(0),
            createMany: vi.fn().mockResolvedValue({ count: 7 }),
          },
          vaultFolder: {
            count: vi.fn().mockResolvedValue(0),
            createMany: vi.fn().mockResolvedValue({ count: 4 }),
          },
          page: {
            count: vi.fn().mockResolvedValue(0),
            create: vi.fn().mockResolvedValue({ id: "page-1" }),
          },
        };
        return cb(tx);
      }),
      project: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaClient;

    const result = await seedDefaultProject("ws-456", "user-456", mockDb);
    expect(result.id).toBe("proj-new-general");
    expect(result.key).toBe("general");
    expect(mockDb.project.findUnique).toHaveBeenCalled();
  });
});

describe("createOnboardingWorkspace — idempotency guard", () => {
  beforeEach(() => {
    vi.spyOn(LockingService, "acquire").mockResolvedValue(true);
    vi.spyOn(LockingService, "release").mockResolvedValue(true);
  });

  it("returns existing workspace if user already has one without creating new workspace", async () => {
    const mockExisting = { id: "ws-existing-1", name: "Existing WS", slug: "existing-ws" };

    const mockCtx = {
      auth: {
        userId: "user-alice",
      },
      db: {
        workspaceMember: {
          findMany: vi.fn().mockResolvedValue([
            {
              workspace: mockExisting,
            },
          ]),
        },
        project: {
          count: vi.fn().mockResolvedValue(1),
          findUnique: vi.fn().mockResolvedValue({ id: "proj-1" }),
        },
      },
      redis: {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue("OK"),
        del: vi.fn().mockResolvedValue(1),
      },
    } as unknown as ServiceContext;

    const result = await createOnboardingWorkspace(
      {
        userId: "user-alice",
        userFullName: "Alice",
      },
      mockCtx
    );

    expect(result.id).toBe("ws-existing-1");
  });
});
