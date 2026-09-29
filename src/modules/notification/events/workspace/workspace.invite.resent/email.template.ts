import { wrapEmail, ctaButton, signoff, note } from "@/modules/notification/channels/email/templates/base";

export function renderWorkspaceInviteResentEmail(data: Record<string, unknown>): string {
  const inviterName   = String(data.inviterName   ?? "Someone");
  const workspaceName = String(data.workspaceName ?? "a workspace");
  const roleName      = String(data.roleName      ?? "Member");
  const ctaUrl        = String(data.ctaUrl        ?? "https://collabifyy.com");

  return wrapEmail({
    preheader: `Your invite to ${workspaceName} is still open. Don't leave them hanging.`,
    body: `
      <h1 class="email-heading">Still waiting for you to join.</h1>
      <p class="email-text">
        Just a nudge — ${inviterName} invited you to
        <strong>${workspaceName}</strong> a few days ago and your invite is still pending.
      </p>
      <p class="email-text">
        Your access is already set up as <strong>${roleName}</strong>,
        so you can jump straight in.
      </p>
      ${ctaButton(`Join ${workspaceName}`, ctaUrl)}
      ${note("This invite will expire soon. If you don't want to join, no action needed.")}
      ${signoff()}
    `,
  });
}
