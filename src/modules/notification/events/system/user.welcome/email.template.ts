import {
  wrapEmail,
  ctaButton,
  signoff,
  note,
  BRAND,
  BORDER,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "@/modules/notification/channels/email/templates/base";

export function renderWelcomeEmail(data: Record<string, unknown>): string {
  const name   = String(data.userName ?? "there");
  const ctaUrl = String(data.ctaUrl  ?? "https://collabifyy.com/onboarding");

  return wrapEmail({
    preheader: "Everything your team uses — in one place. Let's get you started.",
    body: `
      <h1 class="email-heading" style="font-size:22px;font-weight:700;color:${TEXT_PRIMARY};letter-spacing:-0.4px;line-height:1.3;margin:0 0 16px;text-align:left;">
        Your account is ready, ${name}.
      </h1>
      
      <p class="email-text" style="font-size:15px;color:${TEXT_SECONDARY};margin:0 0 18px;line-height:1.6;text-align:left;">
        Welcome to Collabifyy &mdash; a single workspace where chat, tasks, docs, and whiteboards stay connected by default instead of scattered across disconnected tools.
      </p>

      <p class="email-text" style="font-size:14px;font-weight:600;color:${TEXT_PRIMARY};margin:0 0 12px;line-height:1.5;text-align:left;">
        Here's what you can do right now:
      </p>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 24px;border:1px solid ${BORDER};border-radius:8px;background-color:#F8FAFC;border-spacing:0;border-collapse:collapse;text-align:left;">
        <tr>
          <td style="padding:14px 18px;border-bottom:1px solid #EDF2F7;vertical-align:top;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0;">
              <tr>
                <td style="width:26px;vertical-align:top;padding-top:1px;">
                  <div style="width:20px;height:20px;border-radius:50%;background-color:${BRAND};color:#ffffff;font-size:11px;font-weight:700;text-align:center;line-height:20px;font-family:'Inter',sans-serif;">1</div>
                </td>
                <td style="padding-left:12px;vertical-align:top;text-align:left;">
                  <div style="font-size:14px;font-weight:600;color:${TEXT_PRIMARY};line-height:1.4;">Create or join a workspace</div>
                  <div style="font-size:13px;color:${TEXT_SECONDARY};line-height:1.4;margin-top:2px;">Set up your team's workspace or accept an invitation to jump right in.</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 18px;border-bottom:1px solid #EDF2F7;vertical-align:top;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0;">
              <tr>
                <td style="width:26px;vertical-align:top;padding-top:1px;">
                  <div style="width:20px;height:20px;border-radius:50%;background-color:${BRAND};color:#ffffff;font-size:11px;font-weight:700;text-align:center;line-height:20px;font-family:'Inter',sans-serif;">2</div>
                </td>
                <td style="padding-left:12px;vertical-align:top;text-align:left;">
                  <div style="font-size:14px;font-weight:600;color:${TEXT_PRIMARY};line-height:1.4;">Invite your team</div>
                  <div style="font-size:13px;color:${TEXT_SECONDARY};line-height:1.4;margin-top:2px;">Work moves faster when everyone has shared channels, docs, and context.</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 18px;vertical-align:top;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0;">
              <tr>
                <td style="width:26px;vertical-align:top;padding-top:1px;">
                  <div style="width:20px;height:20px;border-radius:50%;background-color:${BRAND};color:#ffffff;font-size:11px;font-weight:700;text-align:center;line-height:20px;font-family:'Inter',sans-serif;">3</div>
                </td>
                <td style="padding-left:12px;vertical-align:top;text-align:left;">
                  <div style="font-size:14px;font-weight:600;color:${TEXT_PRIMARY};line-height:1.4;">Start collaborating</div>
                  <div style="font-size:13px;color:${TEXT_SECONDARY};line-height:1.4;margin-top:2px;">Track sprint issues, write real-time docs, or brainstorm on a live canvas.</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <p class="email-text" style="font-size:14px;color:${TEXT_SECONDARY};margin:0 0 20px;line-height:1.6;text-align:left;">
        Setup takes less than two minutes. Once you're in, you'll have all your work unified in one place.
      </p>

      ${ctaButton("Open Collabifyy", ctaUrl)}

      ${note("Questions? Simply reply to this email &mdash; it goes straight to a human on our team.")}

      ${signoff()}
    `,
  });
}

