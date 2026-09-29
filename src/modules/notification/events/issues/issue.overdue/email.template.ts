import { wrapEmail, ctaButton, infoBlock, signoff } from "@/modules/notification/channels/email/templates/base";

export function renderIssueOverdueEmail(data: Record<string, unknown>): string {
  const issueNumber = String(data.issueNumber ?? "");
  const issueTitle  = String(data.issueTitle  ?? "Untitled issue");
  const projectName = String(data.projectName ?? "");
  const daysOverdue = Number(data.daysOverdue ?? 1);
  const ctaUrl      = String(data.ctaUrl      ?? "https://collabifyy.com");

  const dayLabel = daysOverdue === 1 ? "1 day" : `${daysOverdue} days`;

  return wrapEmail({
    preheader: `#${issueNumber} in ${projectName} passed its due date. Time to close it out.`,
    body: `
      <h1 class="email-heading">"${issueTitle}" is ${dayLabel} overdue.</h1>
      <p class="email-text">
        Issue <strong>#${issueNumber}</strong> in
        <strong>${projectName}</strong> was due ${dayLabel} ago and is still open.
      </p>
      ${infoBlock([
        { label: "Issue",   value: `#${issueNumber} — ${issueTitle}` },
        { label: "Project", value: projectName                        },
        { label: "Overdue", value: dayLabel                          },
      ])}
      <p class="email-text">
        This is a heads-up, not a chase. If the work is done, mark it closed.
        If scope changed, update the due date — your team will see it automatically.
      </p>
      ${ctaButton("Update Issue Status", ctaUrl)}
      ${signoff()}
    `,
  });
}
