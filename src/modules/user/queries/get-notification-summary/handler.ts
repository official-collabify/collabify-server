/**
 * getNotificationSummary — Query Handler
 *
 * Returns the current user's global notification preferences.
 * Feeds the Layer 1 + 2 notification settings UI.
 */
import type { GetNotificationSummaryInput } from "./schema";
import type { NotificationSummaryOutput } from "./types";
import * as prefCache from "@/modules/notification/shared/preferences/preference-cache";
import {
  mapCategoriesToGql,
  mapGlobalNotifModeToGql,
} from "@/modules/user/graphql/mappers";

export const getNotificationSummary = async (
  input: GetNotificationSummaryInput
): Promise<NotificationSummaryOutput> => {
  const { userId } = input;

  const global = await prefCache.getGlobal(userId);

  const categories = mapCategoriesToGql(global.categories);

  const isDndActive = global.muteUntil
    ? new Date(global.muteUntil).getTime() > Date.now()
    : false;

  return {
    globalMode:   mapGlobalNotifModeToGql(global.globalMode),
    emailEnabled: global.emailEnabled,
    pushEnabled:  global.pushEnabled,
    isDndActive,
    dndUntil:     isDndActive ? global.muteUntil : null,
    categories,
  };
};
