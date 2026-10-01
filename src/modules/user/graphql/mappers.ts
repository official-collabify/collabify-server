/**
 * User GraphQL Mappers — Domain types → GraphQL shapes.
 *
 * PATTERN: Mirrors vault/graphql/mappers.ts and pages/graphql/mappers.ts.
 * Converts internal domain notification preference shapes and enums into
 * schema-generated GraphQL shapes (CategoryPreferenceSetting, GlobalNotifMode).
 */

import {
  NotificationCategory as GqlNotificationCategory,
  GlobalNotifMode as GqlGlobalNotifMode,
  type CategoryPreferenceSetting,
} from "@/graphql/generated";
import type { NotificationCategory as InternalCategory } from "@/modules/notification/events/types";
import type {
  CategorySetting,
  GlobalNotifMode as InternalGlobalNotifMode,
} from "@/modules/notification/shared/preferences/preference-types";
import {
  ALL_CATEGORIES,
  categoryDefaults,
} from "@/modules/notification/shared/preferences/preference-defaults";

/**
 * Compile-time exhaustive map from internal domain NotificationCategory
 * to GraphQL schema enum NotificationCategory.
 */
export const NOTIFICATION_CATEGORY_MAP: Record<InternalCategory, GqlNotificationCategory> = {
  chat_messages: GqlNotificationCategory.ChatMessages,
  mentions: GqlNotificationCategory.Mentions,
  reactions: GqlNotificationCategory.Reactions,
  assignments: GqlNotificationCategory.Assignments,
  deadlines: GqlNotificationCategory.Deadlines,
  access_changes: GqlNotificationCategory.AccessChanges,
  collaboration: GqlNotificationCategory.Collaboration,
  system_admin: GqlNotificationCategory.SystemAdmin,
};

/**
 * Compile-time exhaustive map from internal domain GlobalNotifMode
 * to GraphQL schema enum GlobalNotifMode.
 */
export const GLOBAL_NOTIF_MODE_MAP: Record<InternalGlobalNotifMode, GqlGlobalNotifMode> = {
  ALL: GqlGlobalNotifMode.All,
  MENTIONS_ONLY: GqlGlobalNotifMode.MentionsOnly,
  NOTHING: GqlGlobalNotifMode.Nothing,
};

/**
 * Maps internal category settings record into an array of GraphQL CategoryPreferenceSetting items.
 */
export function mapCategoriesToGql(
  categoriesRecord: Record<InternalCategory, CategorySetting>
): Array<Omit<CategoryPreferenceSetting, "__typename">> {
  return ALL_CATEGORIES.map((categoryKey) => {
    const setting = categoriesRecord[categoryKey] ?? categoryDefaults[categoryKey];
    return {
      category: NOTIFICATION_CATEGORY_MAP[categoryKey],
      email: setting.email,
      push: setting.push,
      inApp: setting.inApp,
    };
  });
}

/**
 * Maps internal GlobalNotifMode to GraphQL enum GlobalNotifMode safely.
 */
export function mapGlobalNotifModeToGql(mode: InternalGlobalNotifMode): GqlGlobalNotifMode {
  return GLOBAL_NOTIF_MODE_MAP[mode] ?? GqlGlobalNotifMode.All;
}
