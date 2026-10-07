import { z } from "zod";

export const RecordWorkspaceAccessSchema = z.object({
  workspaceSlug: z.string().min(1),
  projectSlug: z.string().min(1).nullish(),
  actorUserId: z.string().min(1),
});

export type RecordWorkspaceAccessInput = z.infer<typeof RecordWorkspaceAccessSchema>;
