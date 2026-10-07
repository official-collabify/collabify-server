-- AlterTable
ALTER TABLE "workspace_members" 
  ADD COLUMN "last_accessed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "last_active_project_id" TEXT;

-- Backfill last_accessed_at from joined_at
UPDATE "workspace_members" SET "last_accessed_at" = "joined_at";

-- CreateIndex
CREATE INDEX "workspace_members_user_id_last_accessed_at_idx" ON "workspace_members"("user_id", "last_accessed_at" DESC);

-- AddForeignKey
ALTER TABLE "workspace_members" 
  ADD CONSTRAINT "workspace_members_last_active_project_id_fkey" 
  FOREIGN KEY ("last_active_project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
