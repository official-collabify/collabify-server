import { wrapEmail, ctaButton, usageBar, signoff, note } from "@/modules/notification/channels/email/templates/base";

export function renderVaultStorageLimitEmail(data: Record<string, unknown>): string {
  const workspaceName  = String(data.workspaceName  ?? "your workspace");
  const usedFormatted  = String(data.usedFormatted  ?? "—");
  const limitFormatted = String(data.limitFormatted ?? "—");
  const usagePct       = Number(data.usagePct       ?? 0);
  const upgradeUrl     = String(data.upgradeUrl     ?? "https://collabifyy.com/settings/billing");

  const atLimit  = usagePct >= 100;
  const ctaLabel = atLimit ? "Upgrade Now" : "Upgrade Storage";
  const heading  = atLimit
    ? "Vault storage full — uploads are paused."
    : `Your file vault is ${Math.round(usagePct)}% full.`;
  const bodyText = atLimit
    ? `<strong>${workspaceName}'s</strong> vault is full. New file uploads are paused until you upgrade.`
    : `<strong>${workspaceName}'s</strong> file vault is getting full. Uploads will pause once you hit the limit.`;

  return wrapEmail({
    preheader: `${workspaceName} is using ${usedFormatted} of ${limitFormatted}.`,
    body: `
      <h1 class="email-heading">${heading}</h1>
      <p class="email-text">${bodyText}</p>
      <div style="margin:20px 0;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;">
          <span style="font-size:13px;color:#555;font-weight:500;">Storage used</span>
          <span style="font-size:13px;color:#111;font-weight:600;">${usedFormatted} of ${limitFormatted} (${Math.round(usagePct)}%)</span>
        </div>
        ${usageBar(usagePct)}
      </div>
      <p class="email-text" style="font-size:14px;">
        Upgrade your plan to get more storage, or clear out files you no longer need.
      </p>
      ${ctaButton(ctaLabel, upgradeUrl)}
      ${note("You're receiving this as the workspace owner.")}
      ${signoff()}
    `,
  });
}
