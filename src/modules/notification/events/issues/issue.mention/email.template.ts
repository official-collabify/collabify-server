import { wrapEmail, ctaButton, infoBlock, quoteBlock, signoff } from "@/modules/notification/channels/email/templates/base";

export function renderIssueMentionEmail(data: Record<string, unknown>): string {
  const actorName      = String(data.actorName      ?? "Someone");
  const issueNumber    = String(data.issueNumber    ?? "");
  const issueTitle     = String(data.issueTitle     ?? "Untitled issue");
  const projectName    = String(data.projectName    ?? "");
  const contextSnippet = data.contextSnippet ? String(data.contextSnippet) : null;
  const ctaUrl         = String(data.ctaUrl         ?? "https://collabifyy.com");

  return wrapEmail({
    preheader: `You were tagged in "${issueTitle}" — ${projectName}.`,
    body: `
      <h1 class="email-heading">${actorName} mentioned you.</h1>
      <p class="email-text">
        You were mentioned in
        <strong>#${issueNumber} — ${issueTitle}</strong>
        in <strong>${projectName}</strong>.
      </p>
      ${contextSnippet ? quoteBlock(contextSnippet) : ""}
      ${infoBlock([
        { label: "Issue",   value: `#${issueNumber} — ${issueTitle}` },
        { label: "Project", value: projectName                        },
      ])}
      ${ctaButton("See the mention", ctaUrl)}
      ${signoff()}
    `,
  });
}
