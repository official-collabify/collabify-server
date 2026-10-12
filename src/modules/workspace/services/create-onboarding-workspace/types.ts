import { z } from "zod";
import { CreateOnboardingWorkspaceSchema } from "./schema";
import type { Workspace } from "@prisma/client";

export type CreateOnboardingWorkspaceInput = z.infer<
  typeof CreateOnboardingWorkspaceSchema
>;

export type CreateOnboardingWorkspaceResult = Workspace;
