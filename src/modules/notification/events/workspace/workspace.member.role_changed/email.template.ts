import { wrapEmail, ctaButton, infoBlock, signoff } from "@/modules/notification/channels/email/templates/base";

export function renderWorkspaceRoleChangedEmail(data: Record<string, unknown>): string {
  const userName      = String(data.userName      ?? "there");
  const actorName     = String(data.actorName     ?? "A workspace admin");
  const workspaceName = String(data.workspaceName ?? "your workspace");
  const oldRoleName   = String(data.oldRoleName   ?? "—");
  const newRoleName   = String(data.newRoleName   ?? "—");
  const ctaUrl        = String(data.ctaUrl        ?? "https://collabifyy.com");

  return wrapEmail({
    preheader: `${actorName} changed your access from ${oldRoleName} to ${newRoleName}.`,
    body: `
      <h1 class="email-heading">Your role has been updated, ${userName}.</h1>
      <p class="email-text">
        ${actorName} updated your role in <strong>${workspaceName}</strong>.
        Your permissions changed immediately.
      </p>
      ${infoBlock([
        { label: "Workspace",     value: workspaceName },
        { label: "Previous role", value: oldRoleName   },
        { label: "New role",      value: newRoleName   },
        { label: "Changed by",    value: actorName     },
      ])}
      <p class="email-text">
        If you think this was a mistake, reach out to a workspace admin directly.
      </p>
      ${ctaButton(`Open ${workspaceName}`, ctaUrl)}
      ${signoff()}
    `,
  });
}
