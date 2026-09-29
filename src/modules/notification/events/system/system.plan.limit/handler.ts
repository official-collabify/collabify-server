import type { NotificationHandler, Recipient } from "../../types";
import type { Payload } from "./definition";
export { renderPlanLimitEmail as emailTemplate } from "./email.template";

const LIMIT_LABELS: Record<string, string> = {
  members:   "team members",
  storage:   "storage",
  projects:  "projects",
  api_calls: "API calls",
};

export const handler: NotificationHandler<Payload> = {
  async resolveRecipients(payload): Promise<Recipient[]> {
    return [{ userId: payload.ownerId, email: null }];
  },

  async buildInApp(payload) {
    const label = LIMIT_LABELS[payload.limitType] ?? payload.limitType;
    const critical = payload.usagePct >= 100;
    return {
      title:      critical ? `Plan limit reached — ${label}` : `Approaching ${label} limit (${Math.round(payload.usagePct)}%)`,
      body:       `${payload.workspaceName} has used ${payload.currentUsage} of ${payload.limit} ${label}. Upgrade to continue scaling.`,
      actionUrl:  payload.upgradeUrl,
      entityType: "WORKSPACE",
      entityId:   payload.workspaceId,
    };
  },

  async buildEmail(payload) {
    const label    = LIMIT_LABELS[payload.limitType] ?? payload.limitType;
    const atLimit  = payload.usagePct >= 100;
    const subject  = atLimit
      ? `${payload.workspaceName} has hit its ${label} limit`
      : `${payload.workspaceName} is at ${Math.round(payload.usagePct)}% of its ${label} limit`;
    return {
      to:       "", // resolved from user record by email worker
      subject,
      template: "plan-limit",
      data: {
        workspaceName: payload.workspaceName,
        limitType:     label,
        currentUsage:  payload.currentUsage,
        limit:         payload.limit,
        usagePct:      payload.usagePct,
        upgradeUrl:    payload.upgradeUrl,
      },
    };
  },
};
