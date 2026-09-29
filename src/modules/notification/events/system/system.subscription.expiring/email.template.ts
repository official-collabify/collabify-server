import { wrapEmail, ctaButton, infoBlock, signoff, note } from "@/modules/notification/channels/email/templates/base";

export function renderSubscriptionExpiringEmail(data: Record<string, unknown>): string {
  const workspaceName = String(data.workspaceName ?? "your workspace");
  const planName      = String(data.planName      ?? "your plan");
  const daysLeft      = Number(data.daysLeft      ?? 7);
  const expiresAt     = String(data.expiresAt     ?? "");
  const billingUrl    = String(data.billingUrl    ?? "https://collabifyy.com/settings/billing");

  const isUrgent  = daysLeft <= 1;
  const isWarning = daysLeft <= 3;

  const heading = isUrgent
    ? "Your plan expires tomorrow."
    : `Your ${planName} plan expires in ${daysLeft} days.`;

  const ctaLabel = isUrgent ? "Renew Before It Expires" : isWarning ? "Renew Now" : "Renew Subscription";

  const urgencyNote = isUrgent
    ? `<p class="email-text" style="font-weight:600;color:#DC2626;">
        After tomorrow, ${workspaceName} moves to the free tier. Some features and
        data may become inaccessible.
      </p>`
    : `<p class="email-text">
        After expiry, ${workspaceName} will be downgraded to the free tier.
        Renewing keeps everything exactly as it is.
      </p>`;

  return wrapEmail({
    preheader: `Renew ${workspaceName}'s subscription to keep everything running.`,
    body: `
      <h1 class="email-heading">${heading}</h1>
      <p class="email-text">
        The <strong>${planName}</strong> plan for
        <strong>${workspaceName}</strong> is expiring soon.
      </p>
      ${infoBlock([
        { label: "Plan",      value: planName          },
        { label: "Workspace", value: workspaceName     },
        { label: "Expires",   value: expiresAt         },
        { label: "Days left", value: String(daysLeft)  },
      ])}
      ${urgencyNote}
      ${ctaButton(ctaLabel, billingUrl)}
      ${note("You're receiving this as the workspace billing owner.")}
      ${signoff()}
    `,
  });
}
