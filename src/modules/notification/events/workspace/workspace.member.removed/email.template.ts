import { wrapEmail, ctaButton, signoff } from "@/modules/notification/channels/email/templates/base";

export function renderWorkspaceMemberRemovedEmail(data: Record<string, unknown>): string {
  const userName      = String(data.userName      ?? "there");
  const actorName     = String(data.actorName     ?? "A workspace admin");
  const workspaceName = String(data.workspaceName ?? "the workspace");
  const ctaUrl        = String(data.ctaUrl        ?? "https://collabifyy.com/workspaces");

  return wrapEmail({
    preheader: `Your access to ${workspaceName} has been revoked.`,
    body: `
      <h1 class="email-heading">You've been removed from ${workspaceName}.</h1>
      <p class="email-text">
        ${actorName} removed you from <strong>${workspaceName}</strong> on Collabifyy.
        Your access has been revoked effective immediately.
      </p>
      <p class="email-text">
        If you think this was done in error, reach out to a workspace admin directly.
      </p>
      <p class="email-text">
        You still have full access to any other workspaces you belong to.
      </p>
      ${ctaButton("Go to your workspaces", ctaUrl)}
      ${signoff()}
    `,
  });
}
