import { AppError } from "@/shared/errors";
import type { RecordWorkspaceAccessInput } from "./schema";
import type { ServiceContext } from "@/graphql/types";

export const recordWorkspaceAccess = async (
  input: RecordWorkspaceAccessInput,
  ctx: ServiceContext
) => {
  const { workspaceSlug, projectSlug, actorUserId } = input;
  const { db } = ctx;

  // 1. Resolve workspace by slug (ensuring not soft-deleted)
  const workspace = await db.workspace.findFirst({
    where: { slug: workspaceSlug, deletedAt: null },
    select: { id: true, slug: true },
  });
  if (!workspace) throw AppError.notFound("Workspace not found");

  // 2. Validate user membership in this workspace
  const membership = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: actorUserId } },
  });
  if (!membership) throw AppError.forbidden("You are not a member of this workspace");

  // 3. Resolve project if provided
  let projectId: string | null = null;
  if (projectSlug) {
    const project = await db.project.findFirst({
      where: { workspaceId: workspace.id, key: projectSlug, deletedAt: null },
      select: { id: true },
    });
    if (project) {
      projectId = project.id;
    }
  }

  // 4. Update lastAccessedAt and optional lastActiveProjectId atomically
  const updated = await db.workspaceMember.update({
    where: { id: membership.id },
    data: {
      lastAccessedAt: new Date(),
      ...(projectId ? { lastActiveProjectId: projectId } : {}),
    },
    select: { lastAccessedAt: true },
  });

  return {
    success: true,
    workspaceSlug: workspace.slug,
    projectSlug: projectSlug ?? null,
    lastAccessedAt: updated.lastAccessedAt.toISOString(),
  };
};
