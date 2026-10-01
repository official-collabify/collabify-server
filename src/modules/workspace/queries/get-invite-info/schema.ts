import { z } from "zod";

export const GetInviteInfoSchema = z.object({
  token: z.string().min(1),
  userId: z.string().nullish(), // Can be anonymous
  userEmail: z.string().email().nullish(), // For checking match
});
