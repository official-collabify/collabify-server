import type { NotificationHandler, Recipient } from "../../types";
import type { Payload } from "./definition";
import { urls } from "../../_shared/build-helpers";
export { renderSubscriptionExpiringEmail as emailTemplate } from "./email.template";

export const handler: NotificationHandler<Payload> = {
  async resolveRecipients(payload): Promise<Recipient[]> {
    return [{ userId: payload.ownerId, email: null }];
  },

  async buildEmail(payload) {
    const isUrgent = payload.daysLeft <= 1;
    const subject  = isUrgent
      ? `⚠️ Final notice: your plan expires tomorrow`
      : `Your ${payload.planName} plan expires in ${payload.daysLeft} day${payload.daysLeft === 1 ? "" : "s"}${
          payload.daysLeft <= 3 ? " — renew now" : ""
        }`;
    return {
      to:       "", // resolved from user record by email worker
      subject,
      template: "subscription-expiring",
      data: {
        workspaceName: payload.workspaceName,
        planName:      payload.planName,
        daysLeft:      payload.daysLeft,
        expiresAt:     new Date(payload.expiresAt).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
        billingUrl:    payload.billingUrl,
      },
    };
  },

  async buildInApp(payload) {
    return {
      title:      `Subscription expiring in ${payload.daysLeft} day${payload.daysLeft === 1 ? "" : "s"}`,
      body:       `Your ${payload.planName} plan for ${payload.workspaceName} expires soon. Renew to avoid disruption.`,
      actionUrl:  payload.billingUrl,
      entityType: "WORKSPACE",
      entityId:   payload.workspaceId,
    };
  },
};
