import { wrapEmail, ctaButton, signoff, note } from "@/modules/notification/channels/email/templates/base";

export function renderWorkspaceOwnershipTransferredEmail(data: Record<string, unknown>): string {
  const userName      = String(data.userName      ?? "there");
  const actorName     = String(data.actorName     ?? "Someone");
  const workspaceName = String(data.workspaceName ?? "the workspace");
  const isNewOwner    = Boolean(data.isNewOwner);
  const ctaUrl        = String(data.ctaUrl        ?? "https://collabifyy.com");

  if (isNewOwner) {
    return wrapEmail({
      preheader: `${actorName} transferred full ownership of ${workspaceName} to you.`,
      body: `
        <h1 class="email-heading">You're now the owner of ${workspaceName}.</h1>
        <p class="email-text">
          ${actorName} has transferred ownership of
          <strong>${workspaceName}</strong> to you, ${userName}.
        </p>
        <p class="email-text">
          As owner you have full administrative control — billing, member
          management, workspace settings, and everything else.
        </p>
        ${ctaButton(`Manage ${workspaceName}`, ctaUrl)}
        ${note(`If this was unexpected, contact ${actorName} directly or reply to this email.`)}
        ${signoff()}
      `,
    });
  }

  return wrapEmail({
    preheader: `Ownership of ${workspaceName} has been transferred to ${actorName}.`,
    body: `
      <h1 class="email-heading">Ownership transferred.</h1>
      <p class="email-text">
        Hey ${userName}, this confirms you've successfully transferred ownership of
        <strong>${workspaceName}</strong> to <strong>${actorName}</strong>.
      </p>
      <p class="email-text">
        You remain a member of the workspace. If you have any concerns,
        contact your new workspace owner.
      </p>
      ${ctaButton(`Open ${workspaceName}`, ctaUrl)}
      ${signoff()}
    `,
  });
}
