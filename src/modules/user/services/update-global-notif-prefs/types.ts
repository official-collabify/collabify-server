import type { GlobalNotificationPreference } from "@/graphql/generated";

export type { UpdateGlobalNotifPrefsInput } from "./schema";

export type UpdateGlobalNotifPrefsOutput = Omit<GlobalNotificationPreference, "__typename">;
