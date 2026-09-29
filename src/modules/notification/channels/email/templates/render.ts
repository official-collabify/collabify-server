/**
 * render.ts — Maps template name + data → final HTML string.
 *
 * Each template function lives co-located with its handler in:
 *   events/{category}/{event.name}/email.template.ts
 *
 * Import this in email.worker.ts and call renderEmail(content.template, content.data).
 */

import { renderWelcomeEmail }                         from "../../../events/system/user.welcome/email.template";
import { renderWorkspaceInviteSentEmail }              from "../../../events/workspace/workspace.invite.sent/email.template";
import { renderWorkspaceInviteResentEmail }            from "../../../events/workspace/workspace.invite.resent/email.template";
import { renderWorkspaceRoleChangedEmail }             from "../../../events/workspace/workspace.member.role_changed/email.template";
import { renderWorkspaceMemberRemovedEmail }           from "../../../events/workspace/workspace.member.removed/email.template";
import { renderWorkspaceOwnershipTransferredEmail }    from "../../../events/workspace/workspace.ownership.transferred/email.template";
import { renderIssueAssignedEmail }                    from "../../../events/issues/issue.assigned/email.template";
import { renderIssueMentionEmail }                     from "../../../events/issues/issue.mention/email.template";
import { renderIssueDueDateEmail }                     from "../../../events/issues/issue.due_date.approaching/email.template";
import { renderIssueOverdueEmail }                     from "../../../events/issues/issue.overdue/email.template";
import { renderPlanLimitEmail }                        from "../../../events/system/system.plan.limit/email.template";
import { renderSubscriptionExpiringEmail }             from "../../../events/system/system.subscription.expiring/email.template";
import { renderVaultStorageLimitEmail }                from "../../../events/vault/vault.storage.limit/email.template";

type TemplateData = Record<string, any>;
type TemplateFn   = (data: TemplateData) => string;

const TEMPLATES: Record<string, TemplateFn> = {
  "welcome":                          renderWelcomeEmail,
  "workspace-invite":                 renderWorkspaceInviteSentEmail,
  "workspace-invite-resent":          renderWorkspaceInviteResentEmail,
  "workspace-role-changed":           renderWorkspaceRoleChangedEmail,
  "workspace-member-removed":         renderWorkspaceMemberRemovedEmail,
  "workspace-ownership-transferred":  renderWorkspaceOwnershipTransferredEmail,
  "issue-assigned":                   renderIssueAssignedEmail,
  "issue-mention":                    renderIssueMentionEmail,
  "issue-due-date":                   renderIssueDueDateEmail,
  "issue-overdue":                    renderIssueOverdueEmail,
  "plan-limit":                       renderPlanLimitEmail,
  "subscription-expiring":            renderSubscriptionExpiringEmail,
  "vault-storage-limit":              renderVaultStorageLimitEmail,
};

/**
 * Render a named email template with dynamic data.
 * Falls back to a plain-text debug table if the template name is unknown.
 */
export function renderEmail(template: string, data: TemplateData): string {
  const fn = TEMPLATES[template];
  if (!fn) {
    const rows = Object.entries(data)
      .map(([k, v]) => `<tr><td><b>${k}</b></td><td>${String(v ?? "")}</td></tr>`)
      .join("");
    return `<p style="font-family:sans-serif;color:#555;">Unknown template: <code>${template}</code></p><table>${rows}</table>`;
  }
  return fn(data);
}
