import type { NotificationHandler, Recipient } from "../../types";
import type { Payload } from "./definition";
import { urls, pushOf } from "../../_shared/build-helpers";
export { renderWelcomeEmail as emailTemplate } from "./email.template";

export const handler: NotificationHandler<Payload> = {
  async resolveRecipients(payload): Promise<Recipient[]> {
    return [{ userId: payload.userId, email: payload.userEmail }];
  },

  async buildEmail(payload, recipient) {
    return {
      to:       recipient.email ?? payload.userEmail,
      subject:  `Your Collabifyy account is ready, ${payload.userName}`,
      template: "welcome",
      data: {
        userName: payload.userName,
        ctaUrl:   urls.app() + "/onboarding",
      },
    };
  },

  async buildInApp(payload) {
    return {
      title:      "Welcome to Collabify 🚀",
      body:       `Hi ${payload.userName}, your journey to better collaboration starts here.`,
      actionUrl:  "/onboarding",
      entityType: "USER",
      entityId:   payload.userId,
    };
  },
};
