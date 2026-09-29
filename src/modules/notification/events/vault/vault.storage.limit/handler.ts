import type { NotificationHandler, Recipient } from "../../types";
import type { Payload } from "./definition";
export { renderVaultStorageLimitEmail as emailTemplate } from "./email.template";
const fmt = (bytes: number) => bytes < 1_073_741_824 ? `${(bytes / 1_048_576).toFixed(0)} MB` : `${(bytes / 1_073_741_824).toFixed(1)} GB`;
export const handler: NotificationHandler<Payload> = {
  async resolveRecipients(payload): Promise<Recipient[]> { return [{ userId: payload.ownerId, email: null }]; },
  async buildInApp(payload) { return { title: `Vault storage at ${Math.round(payload.usagePct)}%`, body: `${payload.workspaceName} is using ${fmt(payload.usedBytes)} of ${fmt(payload.limitBytes)}. Consider upgrading.`, actionUrl: payload.upgradeUrl, entityType: "WORKSPACE", entityId: payload.workspaceId }; },
  async buildEmail(payload) {
    const atLimit = payload.usagePct >= 100;
    return {
      to: "",
      subject: atLimit
        ? `Vault storage full — uploads are paused`
        : `Your file vault is ${Math.round(payload.usagePct)}% full`,
      template: "vault-storage-limit",
      data: {
        workspaceName:  payload.workspaceName,
        usedFormatted:  fmt(payload.usedBytes),
        limitFormatted: fmt(payload.limitBytes),
        usagePct:       payload.usagePct,
        upgradeUrl:     payload.upgradeUrl,
      },
    };
  },
};
