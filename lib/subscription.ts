import { getSQL } from "@/lib/db";

interface SubCheck {
  canComment: boolean;
  canMessage: boolean;
  canFollow: boolean;
  reason: string | null; // null = allowed, string = why blocked
  tier: string | null;
  subscriptionStatus: string | null;
}

/**
 * Check what a user can do based on their account type and subscription.
 *
 * Store owners (paying rent) get full access — no extra sub needed.
 * Free shoppers: browse, like, leave reviews, enter stores.
 * Subscribed shoppers ($9.99/mo): + comments, messages, follow, shared space.
 */
export async function checkAccess(userId: string): Promise<SubCheck> {
  const sql = getSQL();
  const rows = await sql`
    SELECT account_type, subscription_status, subscription_tier
    FROM users WHERE id = ${userId}
  `;

  if (!rows[0]) {
    return { canComment: false, canMessage: false, canFollow: false, reason: "User not found", tier: null, subscriptionStatus: null };
  }

  const { account_type, subscription_status, subscription_tier } = rows[0];

  // Store owners always have full access — they're paying rent
  if (account_type === "store_owner") {
    return { canComment: true, canMessage: true, canFollow: true, reason: null, tier: subscription_tier || "owner", subscriptionStatus: subscription_status || "active" };
  }

  // Shoppers — check subscription
  if (subscription_status === "active") {
    return { canComment: true, canMessage: true, canFollow: true, reason: null, tier: subscription_tier, subscriptionStatus: subscription_status };
  }

  // Free shopper — gated
  return {
    canComment: false,
    canMessage: false,
    canFollow: false,
    reason: "Upgrade to Mall+ ($9.99/mo) to chat, comment, message, and follow builders.",
    tier: null,
    subscriptionStatus: subscription_status,
  };
}
