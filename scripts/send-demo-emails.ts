/**
 * scripts/send-demo-emails.ts
 *
 * Sends a demo email for every template to aisarthak2@gmail.com via Resend.
 * Run from the server/ directory:
 *   bun run scripts/send-demo-emails.ts
 */

import { Resend } from "resend";
import { renderEmail } from "../src/modules/notification/channels/email/templates/render";

const TO      = "aisarthak2@gmail.com";
const API_KEY = process.env.RESEND_API_KEY;
if (!API_KEY) {
  console.error("Missing RESEND_API_KEY environment variable. Run with: RESEND_API_KEY=... bun run scripts/send-demo-emails.ts");
  process.exit(1);
}
const FROM    = process.env.EMAIL_FROM ?? "Collabifyy <no-reply@collabifyy.com>";

const resend  = new Resend(API_KEY);

// ---------------------------------------------------------------------------
// All 13 templates with realistic sample data
// ---------------------------------------------------------------------------
const DEMOS: Array<{ subject: string; template: string; data: Record<string, unknown> }> = [
  {
    subject:  "1/13 — Welcome email",
    template: "welcome",
    data: {
      userName: "Sarthak",
      ctaUrl:   "https://collabifyy.com/onboarding",
    },
  },
  {
    subject:  "2/13 — Workspace invite (first send)",
    template: "workspace-invite",
    data: {
      inviterName:   "Rahul Sharma",
      workspaceName: "Acme Engineering",
      roleName:      "Editor",
      ctaUrl:        "https://collabifyy.com/invite/abc123tok",
    },
  },
  {
    subject:  "3/13 — Workspace invite (resend / reminder)",
    template: "workspace-invite-resent",
    data: {
      inviterName:   "Rahul Sharma",
      workspaceName: "Acme Engineering",
      roleName:      "Editor",
      ctaUrl:        "https://collabifyy.com/invite/abc123tok",
    },
  },
  {
    subject:  "4/13 — Role changed",
    template: "workspace-role-changed",
    data: {
      userName:      "Sarthak",
      actorName:     "Rahul Sharma",
      workspaceName: "Acme Engineering",
      oldRoleName:   "Member",
      newRoleName:   "Admin",
      ctaUrl:        "https://collabifyy.com/acme-engineering/settings",
    },
  },
  {
    subject:  "5/13 — Member removed",
    template: "workspace-member-removed",
    data: {
      userName:      "Sarthak",
      actorName:     "Rahul Sharma",
      workspaceName: "Acme Engineering",
      ctaUrl:        "https://collabifyy.com/workspaces",
    },
  },
  {
    subject:  "6/13 — Ownership transferred (to new owner)",
    template: "workspace-ownership-transferred",
    data: {
      userName:      "Sarthak",
      actorName:     "Rahul Sharma",
      workspaceName: "Acme Engineering",
      isNewOwner:    true,
      ctaUrl:        "https://collabifyy.com/acme-engineering/settings",
    },
  },
  {
    subject:  "7/13 — Issue assigned",
    template: "issue-assigned",
    data: {
      actorName:   "Priya Singh",
      issueNumber: "42",
      issueTitle:  "Fix login redirect on mobile Safari",
      projectName: "Frontend — Q4",
      ctaUrl:      "https://collabifyy.com/acme-engineering/issues/42",
    },
  },
  {
    subject:  "8/13 — Issue mention",
    template: "issue-mention",
    data: {
      actorName:      "Priya Singh",
      issueNumber:    "42",
      issueTitle:     "Fix login redirect on mobile Safari",
      projectName:    "Frontend — Q4",
      contextSnippet: "Hey @sarthak, can you take a look at the redirect logic in auth.ts? I think the issue is in the session cookie path.",
      ctaUrl:         "https://collabifyy.com/acme-engineering/issues/42#comment-7",
    },
  },
  {
    subject:  "9/13 — Issue due date (tomorrow)",
    template: "issue-due-date",
    data: {
      issueNumber:  "42",
      issueTitle:   "Fix login redirect on mobile Safari",
      projectName:  "Frontend — Q4",
      daysUntilDue: 1,
      dueDate:      "Monday, 30 September 2026",
      ctaUrl:       "https://collabifyy.com/acme-engineering/issues/42",
    },
  },
  {
    subject:  "10/13 — Issue overdue",
    template: "issue-overdue",
    data: {
      issueNumber: "38",
      issueTitle:  "Audit trail for admin actions",
      projectName: "Security & Compliance",
      daysOverdue: 3,
      ctaUrl:      "https://collabifyy.com/acme-engineering/issues/38",
    },
  },
  {
    subject:  "11/13 — Plan limit (80% warning)",
    template: "plan-limit",
    data: {
      workspaceName: "Acme Engineering",
      limitType:     "team members",
      currentUsage:  "16",
      limit:         "20",
      usagePct:      80,
      upgradeUrl:    "https://collabifyy.com/acme-engineering/settings/billing",
    },
  },
  {
    subject:  "12/13 — Subscription expiring (3 days)",
    template: "subscription-expiring",
    data: {
      workspaceName: "Acme Engineering",
      planName:      "Pro",
      daysLeft:      3,
      expiresAt:     "Wednesday, 1 October 2026",
      billingUrl:    "https://collabifyy.com/acme-engineering/settings/billing",
    },
  },
  {
    subject:  "13/13 — Vault storage full",
    template: "vault-storage-limit",
    data: {
      workspaceName:  "Acme Engineering",
      usedFormatted:  "4.9 GB",
      limitFormatted: "5 GB",
      usagePct:       100,
      upgradeUrl:     "https://collabifyy.com/acme-engineering/settings/billing",
    },
  },
];

// ---------------------------------------------------------------------------
// Send sequentially so Resend rate-limits don't bite
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\n🚀 Sending ${DEMOS.length} demo emails to ${TO}\n`);

  for (const demo of DEMOS) {
    const html = renderEmail(demo.template, demo.data);

    const result = await resend.emails.send({
      from:    FROM,
      to:      TO,
      subject: demo.subject,
      html,
    });

    if (result.error) {
      console.error(`  ✗  ${demo.subject}`);
      console.error(`     ${result.error.name}: ${result.error.message}`);
    } else {
      console.log(`  ✓  ${demo.subject}  (id: ${result.data?.id})`);
    }

    // 300 ms gap between sends — stays within Resend's free-tier rate limit
    await new Promise(r => setTimeout(r, 300));
  }

  console.log("\n✅ Done. Check your inbox at", TO, "\n");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
