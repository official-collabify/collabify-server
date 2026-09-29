import { wrapEmail, ctaButton, infoBlock, signoff } from "@/modules/notification/channels/email/templates/base";

export function renderIssueDueDateEmail(data: Record<string, unknown>): string {
  const issueNumber  = String(data.issueNumber  ?? "");
  const issueTitle   = String(data.issueTitle   ?? "Untitled issue");
  const projectName  = String(data.projectName  ?? "");
  const daysUntilDue = Number(data.daysUntilDue ?? 1);
  const dueDate      = String(data.dueDate      ?? "");
  const ctaUrl       = String(data.ctaUrl       ?? "https://collabifyy.com");

  const dueLabel = daysUntilDue === 1 ? "tomorrow" : `in ${daysUntilDue} days`;
  const heading  = daysUntilDue === 1
    ? `"${issueTitle}" is due tomorrow.`
    : `"${issueTitle}" is due in ${daysUntilDue} days.`;

  return wrapEmail({
    preheader: `#${issueNumber} in ${projectName} — check in and update the status.`,
    body: `
      <h1 class="email-heading">${heading}</h1>
      <p class="email-text">
        Issue <strong>#${issueNumber}</strong> in
        <strong>${projectName}</strong> is due ${dueLabel}.
      </p>
      ${infoBlock([
        { label: "Issue",    value: `#${issueNumber} — ${issueTitle}` },
        { label: "Project",  value: projectName                        },
        { label: "Due date", value: dueDate                           },
      ])}
      <p class="email-text">
        If the work is done, close it out. If you need more time, update
        the due date so your team stays in the loop.
      </p>
      ${ctaButton("View Issue", ctaUrl)}
      ${signoff()}
    `,
  });
}
