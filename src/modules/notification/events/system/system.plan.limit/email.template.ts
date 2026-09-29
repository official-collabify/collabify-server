import { wrapEmail, ctaButton, usageBar, signoff, note } from "@/modules/notification/channels/email/templates/base";

export function renderPlanLimitEmail(data: Record<string, unknown>): string {
  const workspaceName = String(data.workspaceName ?? "your workspace");
  const limitType     = String(data.limitType     ?? "resources");
  const currentUsage  = String(data.currentUsage  ?? "—");
  const limit         = String(data.limit         ?? "—");
  const usagePct      = Number(data.usagePct      ?? 0);
  const upgradeUrl    = String(data.upgradeUrl    ?? "https://collabifyy.com/settings/billing");

  const atLimit  = usagePct >= 100;
  const ctaLabel = atLimit ? "Upgrade Now" : "Upgrade Plan";
  const heading  = atLimit
    ? `${workspaceName} has hit its ${limitType} limit.`
    : `${workspaceName} is at ${Math.round(usagePct)}% of its ${limitType} limit.`;
  const preheader = atLimit
    ? `No more ${limitType} can be added until you upgrade.`
    : `You're using ${currentUsage} of ${limit}. Upgrade before you're blocked.`;
  const bodyText  = atLimit
    ? `Your team is currently blocked from adding more <strong>${limitType}</strong>. Upgrade your plan to restore access immediately.`
    : `<strong>${workspaceName}</strong> is approaching its <strong>${limitType}</strong> limit. Once you hit it, new ${limitType} won't be available until you upgrade.`;

  return wrapEmail({
    preheader,
    body: `
      <h1 class="email-heading">${heading}</h1>
      <p class="email-text">${bodyText}</p>
      <div style="margin:20px 0;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;">
          <span style="font-size:13px;color:#555;font-weight:500;">${limitType}</span>
          <span style="font-size:13px;color:#111;font-weight:600;">${currentUsage} / ${limit} (${Math.round(usagePct)}%)</span>
        </div>
        ${usageBar(usagePct)}
      </div>
      <p class="email-text" style="font-size:14px;">Upgrading takes about 30 seconds and keeps your team moving.</p>
      ${ctaButton(ctaLabel, upgradeUrl)}
      ${note("You're receiving this as the workspace owner.")}
      ${signoff()}
    `,
  });
}
