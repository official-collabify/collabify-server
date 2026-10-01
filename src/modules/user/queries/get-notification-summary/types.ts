import type { NotificationSummary } from "@/graphql/generated";

export type NotificationSummaryOutput = Omit<NotificationSummary, "__typename">;

