/**
 * Fetch and validate a workspace invite by token (including workspace details).
 * Throws NOT_FOUND if token is missing or expired.
 */
import { AppError } from "@/shared/errors";
import type { PrismaClient } from "@prisma/client";

export async function fetchInvite(token: string, db: PrismaClient) {
  const invite = await db.workspaceInvite.findUnique({
    where: { token },
    include: {
      workspace: { select: { name: true, logoS3Key: true } },
    },
  });

  if (!invite) {
    throw new AppError(
      "This invite link is invalid or has already been used.",
      "INVITE_NOT_FOUND",
      404
    );
  }

  if (invite.expiresAt < new Date()) {
    throw new AppError(
      "This invite link has expired.",
      "INVITE_EXPIRED",
      404
    );
  }

  return invite;
}
