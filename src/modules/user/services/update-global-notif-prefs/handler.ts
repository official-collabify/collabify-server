/**
 * updateGlobalNotifPrefs — Service Handler
 *
 * Handles all Layer 1 + Layer 2 global preference mutations:
 *   - updateGlobalNotifPrefs: full update (categories + channel toggles + mode)
 *   - setGlobalNotifMode: sets globalMode only
 *   - pauseNotifications: sets muteUntil
 *   - resumeNotifications: clears muteUntil
 *
 * Delegates all DB writes to notification/shared/preference-writer.
 */
import { AppError } from "@/shared/errors";
import { createLogger } from "@/shared/lib/logger";
import type { UpdateGlobalNotifPrefsInput, UpdateGlobalNotifPrefsOutput } from "./types";
import type { ServiceContext } from "@/graphql/types";
import * as prefWriter from "@/modules/notification/shared/preferences/preference-writer";
import * as prefCache from "@/modules/notification/shared/preferences/preference-cache";
import {
  mapCategoriesToGql,
  mapGlobalNotifModeToGql,
} from "@/modules/user/graphql/mappers";

const log = createLogger("user:services:update-global-notif-prefs");

export const updateGlobalNotifPrefs = async (
  input: UpdateGlobalNotifPrefsInput,
  _ctx: ServiceContext
): Promise<UpdateGlobalNotifPrefsOutput> => {
  const { userId, muteUntil, ...rest } = input;

  await prefWriter.updateGlobal(userId, {
    ...rest,
    muteUntil: muteUntil ? new Date(muteUntil) : muteUntil === null ? null : undefined,
  });

  const fresh = await prefCache.getGlobal(userId);
  const categories = mapCategoriesToGql(fresh.categories);

  log.debug("Global notif prefs updated", { userId });

  return {
    emailEnabled: fresh.emailEnabled,
    pushEnabled:  fresh.pushEnabled,
    inAppEnabled: fresh.inAppEnabled,
    globalMode:   mapGlobalNotifModeToGql(fresh.globalMode),
    categories,
  };
};
