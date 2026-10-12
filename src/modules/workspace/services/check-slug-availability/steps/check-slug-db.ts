/** Check if a workspace with this slug already exists in the database or is reserved. */
import type { PrismaClient } from "@prisma/client";
import { RESERVED_SLUGS } from "@/shared/config/limits";

export async function checkSlugDb(
  normalizedSlug: string,
  db: PrismaClient
): Promise<boolean> {
  if ((RESERVED_SLUGS as readonly string[]).includes(normalizedSlug)) {
    return true;
  }
  const existing = await db.workspace.findUnique({
    where: { slug: normalizedSlug },
    select: { id: true },
  });
  return !!existing;
}
