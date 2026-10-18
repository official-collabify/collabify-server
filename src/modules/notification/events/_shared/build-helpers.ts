// =============================================================================
// Shared build helpers for event handlers
// Centralizes repeated patterns across all event types.
// Import from handler.ts files only — not from definition.ts or index.ts.
// =============================================================================

import type { Recipient } from "../types";
import type { EmailContent, InAppContent, PushContent, RealtimeContent } from "../types";
import { env } from "@/shared/config/env";

const APP_URL = process.env.APP_URL ?? env.FRONTEND_URL;

// ── URL builders ──────────────────────────────────────────────────────────────

export const urls = {
  app:          ()                                      => APP_URL,
  workspace:    (slug: string)                          => `${APP_URL}/workspace/${slug}`,
  project:      (slug: string, projectId: string)       => `${APP_URL}/workspace/${slug}/project/${projectId}`,
  issue:        (slug: string, issueId: string)         => `${APP_URL}/workspace/${slug}/issues/${issueId}`,
  page:         (slug: string, pageId: string)          => `${APP_URL}/workspace/${slug}/pages/${pageId}`,
  whiteboard:   (slug: string, wbId: string)            => `${APP_URL}/workspace/${slug}/whiteboard/${wbId}`,
  conversation: (convId: string)                        => `${APP_URL}/chat/${convId}`,
  inviteAccept: (token: string)                         => `${APP_URL}/join?token=${token}`,
};

// ── Realtime helpers ──────────────────────────────────────────────────────────

export function buildRealtimePayload(
  eventType: string,
  data: Record<string, unknown>
): RealtimeContent {
  return { eventType, data };
}

// ── Push helpers ──────────────────────────────────────────────────────────────

export function pushOf(
  title: string,
  body: string,
  data: Record<string, string>
): PushContent {
  return { title, body, data };
}

// ── Actor name helper ─────────────────────────────────────────────────────────

export function actorName(payload: { actorName?: string; actorEmail?: string }): string {
  return payload.actorName ?? payload.actorEmail ?? "Someone";
}
