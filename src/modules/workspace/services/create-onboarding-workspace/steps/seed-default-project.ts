/**
 * Seed the default "General" project and its default resources (channels, board, kanban, vault, page)
 * for a newly created onboarding workspace.
 */
import type { PrismaClient } from "@prisma/client";
import { insertProject } from "@/modules/project/services/create-project/steps/insert-project";
import { seedProjectDefaults } from "@/modules/project/services/create-project/steps/seed-project-defaults";
import { createLogger } from "@/shared/lib/logger";

const logger = createLogger("workspace:services:create-onboarding-workspace:seed-default-project");

export async function seedDefaultProject(
  workspaceId: string,
  userId: string,
  db: PrismaClient
) {
  // Idempotency check: if project with key "general" already exists, do not recreate
  const existing = await db.project.findUnique({
    where: { workspaceId_key: { workspaceId, key: "general" } },
  });

  if (existing) {
    logger.info("Default 'general' project already exists in workspace", {
      workspaceId,
      projectId: existing.id,
    });
    return existing;
  }

  logger.info("Seeding default 'General' project for workspace", {
    workspaceId,
    userId,
  });

  const project = await insertProject(
    workspaceId,
    userId,
    "general",
    {
      name: "General",
      description: "Default project for team collaboration.",
    },
    db
  );

  // Seed default #general channel, whiteboard, kanban columns, vault folders, and page
  try {
    await seedProjectDefaults(project.id, workspaceId, userId, db);
  } catch (err) {
    logger.warn("seedProjectDefaults non-fatal failure for default project", {
      projectId: project.id,
      err,
    });
  }

  return project;
}
