import { wrapEmail, ctaButton, infoBlock, signoff } from "@/modules/notification/channels/email/templates/base";

export function renderIssueAssignedEmail(data: Record<string, unknown>): string {
  const actorName   = String(data.actorName   ?? "Someone");
  const issueNumber = String(data.issueNumber ?? "");
  const issueTitle  = String(data.issueTitle  ?? "Untitled issue");
  const projectName = String(data.projectName ?? "");
  const ctaUrl      = String(data.ctaUrl      ?? "https://collabifyy.com");

  return wrapEmail({
    preheader: `Issue #${issueNumber} in ${projectName} is now yours.`,
    body: `
      <h1 class="email-heading">${actorName} assigned you to an issue.</h1>
      <p class="email-text">
        You've been assigned to the following issue in <strong>${projectName}</strong>.
      </p>
      ${infoBlock([
        { label: "Issue",       value: `#${issueNumber} — ${issueTitle}` },
        { label: "Project",     value: projectName                        },
        { label: "Assigned by", value: actorName                         },
      ])}
      ${ctaButton(`View Issue #${issueNumber}`, ctaUrl)}
      ${signoff()}
    `,
  });
}
