import { wrapEmail, ctaButton, infoBlock, signoff, note } from "@/modules/notification/channels/email/templates/base";

export function renderWorkspaceInviteSentEmail(data: Record<string, unknown>): string {
  const inviterName   = String(data.inviterName   ?? "Someone");
  const workspaceName = String(data.workspaceName ?? "a workspace");
  const roleName      = String(data.roleName      ?? "Member");
  const ctaUrl        = String(data.ctaUrl        ?? "https://collabifyy.com");

  return wrapEmail({
    preheader: `${inviterName} invited you to ${workspaceName}. Accept before this link expires in 7 days.`,
    body: `
      <h1 class="email-heading">You're invited to ${workspaceName}.</h1>
      <p class="email-text">
        ${inviterName} has invited you to join their workspace on Collabifyy
        as <strong>${roleName}</strong>.
      </p>
      <p class="email-text">
        Collabifyy is where teams manage projects, track issues, collaborate
        on whiteboards, and keep all their conversations in one place — without
        switching between tools.
      </p>
      ${infoBlock([
        { label: "Workspace",  value: workspaceName },
        { label: "Your role",  value: roleName      },
        { label: "Invited by", value: inviterName   },
      ])}
      ${ctaButton("Accept Invitation", ctaUrl)}
      ${note("This link is valid for 7 days. If you weren't expecting this, you can safely ignore this email — no account will be created without your action.")}
      ${signoff()}
    `,
  });
}
