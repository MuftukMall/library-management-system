import { db } from "./db";

type ActivityType =
  | "member_created"
  | "member_updated"
  | "member_deleted"
  | "member_renewed"
  | "payment_created"
  | "seat_assigned"
  | "seat_unassigned"
  | "seat_created"
  | "floor_created"
  | "floor_updated"
  | "floor_deleted"
  | "section_created"
  | "section_updated"
  | "section_deleted"
  | "settings_updated"
  | "whatsapp_sent"
  | "data_exported"
  | "data_restored"
  | "system";

/**
 * Log an activity. This is fire-and-forget — errors are silently ignored
 * so it never blocks the main operation.
 */
export async function logActivity(
  type: ActivityType,
  title: string,
  details?: string,
  metadata?: Record<string, unknown>
) {
  try {
    await db.activityLog.create({
      data: {
        type,
        title,
        details: details || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch {
    // Silently ignore — activity logging should never break the main flow
  }
}