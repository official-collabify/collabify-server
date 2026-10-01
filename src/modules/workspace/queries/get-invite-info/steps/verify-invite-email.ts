/**
 * If the caller's email is known, assert it matches the invite email.
 * Throws FORBIDDEN if there is a mismatch.
 */
import { AppError } from "@/shared/errors";

export function verifyInviteEmail(
  inviteEmail: string,
  userEmail?: string | null
): void {
  if (
    userEmail &&
    inviteEmail.trim().toLowerCase() !== userEmail.trim().toLowerCase()
  ) {
    throw AppError.forbidden(
      "This invite was sent to a different email address."
    );
  }
}
