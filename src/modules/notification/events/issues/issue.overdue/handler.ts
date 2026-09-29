import type { NotificationHandler, Recipient, HandlerContext } from "../../types";
import type { Payload } from "./definition";
import { urls } from "../../_shared/build-helpers";
export { renderIssueOverdueEmail as emailTemplate } from "./email.template";
export const handler: NotificationHandler<Payload> = {
  async resolveRecipients(payload): Promise<Recipient[]> {
    return [{ userId: payload.assigneeId, email: null }];
  },
  async shouldDeliver(payload, _r, ctx: HandlerContext): Promise<boolean> {
    const issue = await ctx.db.issue.findUnique({
      where:  { id: payload.issueId },
      select: { status: { select: { name: true } } },
    }).catch(() => null);
    if (issue?.status.name === "Done" || issue?.status.name === "Canceled") return false;
    return true;
  },
  async buildInApp(payload) {
    return {
      title:      `Overdue: #${payload.issueNumber}`,
      body:       `${payload.issueTitle} was due ${payload.daysOverdue} day${payload.daysOverdue === 1 ? "" : "s"} ago.`,
      actionUrl:  urls.issue(payload.workspaceSlug, payload.issueId),
      entityType: "ISSUE", entityId: payload.issueId,
    };
  },
  async buildEmail(payload) {
    return {
      to: "",
      subject: `"${payload.issueTitle}" is ${payload.daysOverdue} day${payload.daysOverdue === 1 ? "" : "s"} overdue`,
      template: "issue-overdue",
      data: {
        issueTitle:  payload.issueTitle,
        issueNumber: payload.issueNumber,
        projectName: payload.projectName,
        daysOverdue: payload.daysOverdue,
        ctaUrl:      urls.issue(payload.workspaceSlug, payload.issueId),
      },
    };
  },
};
