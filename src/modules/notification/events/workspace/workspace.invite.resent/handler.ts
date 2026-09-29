import type { NotificationHandler, Recipient, HandlerContext } from "../../types";
import type { Payload } from "./definition";
import { urls, actorName } from "../../_shared/build-helpers";
export { renderWorkspaceInviteResentEmail as emailTemplate } from "./email.template";

export const handler: NotificationHandler<Payload> = {
  async resolveRecipients(payload): Promise<Recipient[]> {
    return [{ userId: payload.inviteeUserId, email: payload.inviteeEmail }];
  },

  async shouldDeliver(payload, _r, ctx: HandlerContext): Promise<boolean> {
    const invite = await ctx.db.workspaceInvite.findUnique({
      where: { id: payload.inviteId }, select: { expiresAt: true },
    }).catch(() => null);
    // Invite is still actionable if it exists and hasn't expired yet
    return invite !== null && invite.expiresAt > new Date();
  },

  async buildEmail(payload) {
    return {
      to:       payload.inviteeEmail,
      subject:  `Reminder: ${payload.actorName} is still waiting for you to join ${payload.workspaceName}`,
      template: "workspace-invite-resent",
      data: {
        inviterName:   payload.actorName,
        workspaceName: payload.workspaceName,
        roleName:      payload.roleName,
        ctaUrl:        urls.inviteAccept(payload.inviteToken),
      },
    };
  },
};
