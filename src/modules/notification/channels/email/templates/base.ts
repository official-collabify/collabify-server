/**
 * base.ts — Shared HTML shell for all Collabifyy transactional emails.
 *
 * Brand tokens (approximated from oklch design-system values):
 *   --brand-default ≈ #4A6CF7   (oklch 0.4799 0.1158 242.91)
 *   --brand-900    ≈ #3858D6   (oklch 0.4347 0.1041 242.48)
 *   --neutral white ≈ #FFFFFF
 *   --canvas       ≈ #F5F5F5
 *   --text-primary  ≈ #111111
 *   --text-secondary≈ #555555
 *   --text-tertiary ≈ #888888
 *
 * Font: Inter (Google Fonts), fallback to system-ui / sans-serif.
 */

// ---------------------------------------------------------------------------
// Colour constants (hex equivalents of OKLCH design tokens)
// ---------------------------------------------------------------------------
export const BRAND = "#4060EA";
export const BRAND_DARK = "#324EC4";
export const TEXT_PRIMARY = "#111827";
export const TEXT_SECONDARY = "#4B5563";
export const TEXT_TERTIARY = "#6B7280";
export const CANVAS = "#F8FAFC";
export const SURFACE = "#FFFFFF";
export const BORDER = "#E2E8F0";
export const SUCCESS = "#16A34A";
export const WARNING = "#D97706";
export const DANGER = "#DC2626";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wrap any inner content in the full email shell. */
export function wrapEmail(options: {
  preheader: string;
  body: string;
  appUrl?: string;
  logoUrl?: string;
}): string {
  const { preheader, body, appUrl = "https://collabifyy.com" } = options;
  const logoUrl =
    options.logoUrl ??
    (process.env.NODE_ENV === "production"
      ? `${appUrl}/logo.png`
      : "https://files.catbox.moe/pdvta6.png");

  return /* html */ `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Collabifyy</title>
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
    rel="stylesheet"
  />
  <style>
    /* ── Reset ── */
    *, *::before, *::after { box-sizing: border-box; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; display: block; }
    body { margin: 0; padding: 0; background-color: ${CANVAS}; }

    /* ── Base typography ── */
    body, .body-wrap {
      font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
      font-size: 15px;
      line-height: 1.6;
      color: ${TEXT_PRIMARY};
      text-align: left;
    }

    /* ── Card ── */
    .email-card {
      background: ${SURFACE};
      border-radius: 12px;
      border: 1px solid ${BORDER};
      max-width: 580px;
      margin: 0 auto;
      text-align: left;
    }

    /* ── Logo header ── */
    .email-header {
      padding: 32px 40px 0;
      text-align: left;
    }

    /* ── Body ── */
    .email-body {
      padding: 28px 40px 36px;
      text-align: left;
    }

    /* ── Divider ── */
    .email-divider {
      border: none;
      border-top: 1px solid ${BORDER};
      margin: 0;
    }

    /* ── Footer ── */
    .email-footer {
      padding: 24px 40px 32px;
      text-align: center;
    }
    .email-footer p {
      margin: 0 0 6px;
      font-size: 12px;
      color: ${TEXT_TERTIARY};
      line-height: 1.5;
    }
    .email-footer a {
      color: ${TEXT_TERTIARY};
      text-decoration: underline;
    }

    /* ── Heading ── */
    h1.email-heading {
      font-size: 22px;
      font-weight: 700;
      color: ${TEXT_PRIMARY};
      letter-spacing: -0.4px;
      line-height: 1.3;
      margin: 0 0 16px;
      text-align: left;
    }

    /* ── Body text ── */
    p.email-text {
      font-size: 15px;
      color: ${TEXT_SECONDARY};
      margin: 0 0 14px;
      line-height: 1.6;
      text-align: left;
    }
    p.email-text:last-child { margin-bottom: 0; }

    /* ── CTA button ── */
    .cta-btn {
      display: inline-block;
      background: ${BRAND};
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: -0.1px;
      padding: 12px 26px;
      border-radius: 6px;
      line-height: 1;
    }
    .cta-btn:hover { background: ${BRAND_DARK}; }

    /* ── Danger CTA ── */
    .cta-btn-danger {
      background: ${DANGER};
    }
    .cta-btn-danger:hover { background: #b91c1c; }

    /* ── Note / disclaimer ── */
    .email-note {
      font-size: 13px;
      color: ${TEXT_TERTIARY};
      margin: 16px 0 0;
      line-height: 1.5;
      text-align: left;
    }

    /* ── Sign-off ── */
    .signoff {
      font-size: 14px;
      color: ${TEXT_SECONDARY};
      font-weight: 500;
      margin: 24px 0 0;
      text-align: left;
    }

    /* ── Mobile ── */
    @media (max-width: 600px) {
      .email-card { border-radius: 0 !important; border-left: none !important; border-right: none !important; }
      .email-header, .email-body, .email-footer { padding-left: 20px !important; padding-right: 20px !important; }
      h1.email-heading { font-size: 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${CANVAS};">
  <!-- Preheader (hidden, shows in inbox preview) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${preheader}&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0;padding:36px 16px;background-color:${CANVAS};">
    <tr>
      <td align="center" style="padding:0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="email-card" style="max-width:580px;width:100%;margin:0 auto;background-color:${SURFACE};border:1px solid ${BORDER};border-radius:12px;text-align:left;border-collapse:separate;border-spacing:0;overflow:hidden;">
          <!-- ── Header ── -->
          <tr>
            <td class="email-header" align="left" style="padding:32px 40px 0;text-align:left;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-spacing:0;margin:0;">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;width:32px;line-height:0;">
                    <img src="${logoUrl}" width="32" height="32" alt="Collabifyy" style="display:block;width:32px;height:32px;border:0;border-radius:6px;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-family:'Inter',ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:16px;font-weight:700;color:${TEXT_PRIMARY};letter-spacing:-0.4px;line-height:1;">Collabifyy</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Body ── -->
          <tr>
            <td class="email-body" align="left" style="padding:28px 40px 36px;text-align:left;font-family:'Inter',ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.6;color:${TEXT_PRIMARY};">
              ${body}
            </td>
          </tr>

          <!-- ── Divider ── -->
          <tr>
            <td style="padding:0;border-top:1px solid ${BORDER};line-height:0;font-size:0;">
              &nbsp;
            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td class="email-footer" align="center" style="padding:24px 40px 32px;text-align:center;font-family:'Inter',ui-sans-serif,system-ui,-apple-system,sans-serif;">
              <p style="margin:0 0 8px;font-size:12px;color:${TEXT_TERTIARY};line-height:1.5;">
                Manage notification preferences &rarr;
                <a href="${appUrl}/user/settings" style="color:${TEXT_TERTIARY};text-decoration:underline;">${appUrl}/user/settings</a>
              </p>
              <p style="margin:0;font-size:12px;color:${TEXT_TERTIARY};line-height:1.5;">
                &copy; 2026 Collabifyy &middot; <a href="${appUrl}" style="color:${TEXT_TERTIARY};text-decoration:underline;">collabifyy.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

// ---------------------------------------------------------------------------
// Small shared fragments
// ---------------------------------------------------------------------------

export function signoff(): string {
  return `<p class="signoff" style="font-size:14px;color:${TEXT_SECONDARY};font-weight:500;margin:24px 0 0;text-align:left;">&mdash; The Collabifyy team</p>`;
}

export function ctaButton(label: string, url: string, variant: "primary" | "danger" = "primary"): string {
  const bg = variant === "danger" ? DANGER : BRAND;
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 16px;text-align:left;">
  <tr>
    <td align="left" style="border-radius:6px;background-color:${bg};">
      <a href="${url}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 26px;font-family:'Inter',ui-sans-serif,system-ui,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;line-height:1;letter-spacing:-0.2px;">
        ${label} &rarr;
      </a>
    </td>
  </tr>
</table>`;
}

export function infoBlock(rows: Array<{ label: string; value: string }>): string {
  const inner = rows
    .map(
      (r) => `
    <tr>
      <td style="padding:10px 16px;width:120px;font-family:'Inter',ui-sans-serif,system-ui,sans-serif;font-size:12px;font-weight:600;color:${TEXT_TERTIARY};text-transform:uppercase;letter-spacing:0.6px;vertical-align:top;border-bottom:1px solid ${BORDER};">
        ${r.label}
      </td>
      <td style="padding:10px 16px;font-family:'Inter',ui-sans-serif,system-ui,sans-serif;font-size:14px;font-weight:500;color:${TEXT_PRIMARY};vertical-align:top;border-bottom:1px solid ${BORDER};">
        ${r.value}
      </td>
    </tr>`
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:20px 0;background-color:${CANVAS};border:1px solid ${BORDER};border-radius:8px;border-spacing:0;border-collapse:collapse;text-align:left;"><tbody>${inner}</tbody></table>`;
}

export function usageBar(pct: number): string {
  const colour = pct >= 100 ? DANGER : pct >= 80 ? WARNING : BRAND;
  return `
<div class="usage-bar-bg" style="background:${BORDER};border-radius:100px;height:6px;margin:16px 0 8px;overflow:hidden;">
  <div class="usage-bar-fill" style="width:${Math.min(pct, 100)}%;background:${colour};height:6px;border-radius:100px;"></div>
</div>`;
}

export function quoteBlock(text: string): string {
  return `<div class="quote-block" style="border-left:3px solid ${BRAND};padding:12px 16px;margin:16px 0;background-color:#F0F3FE;border-radius:0 6px 6px 0;font-size:14px;color:${TEXT_SECONDARY};font-style:italic;line-height:1.5;text-align:left;">&ldquo;${text}&rdquo;</div>`;
}

export function note(text: string): string {
  return `<p class="email-note" style="font-size:13px;color:${TEXT_TERTIARY};margin:16px 0 0;line-height:1.5;text-align:left;">${text}</p>`;
}

