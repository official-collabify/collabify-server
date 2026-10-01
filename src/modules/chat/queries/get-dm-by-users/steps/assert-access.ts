import type { ServiceContext } from "@/graphql/types";
import { AppError } from "@/shared/errors";

/**
 * assertAccess — auth gate for getDmByUsers.
 *
 * Checks that the caller is authenticated and asserts that the caller is a member
 * of the project where the DM conversation is scoped.
 *
 * @throws AppError 401 if unauthenticated
 * @throws AppError 403 if caller is not a member of the project
 */
export async function assertAccess(
  projectId: string,
  ctx: ServiceContext
): Promise<void> {
  if (!ctx.authGate || !ctx.permissions) throw AppError.unauthorized();
  await ctx.authGate.assertProjectMember(projectId);
}

