import { NextRequest, NextResponse } from "next/server";
import { getSQL } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Allow re-entry if profile isn't complete yet (e.g. store owner backed out of subscribe)
  if (user.profile_complete) {
    return NextResponse.json({ error: "Profile already built" }, { status: 400 });
  }

  const { account_type, bio, pending, founders, store_name, store_type, store_description } = await request.json();

  if (!account_type || !["shopper", "store_owner"].includes(account_type)) {
    return NextResponse.json({ error: "Invalid account type" }, { status: 400 });
  }

  const sql = getSQL();

  // Founders store owner — skip payment, complete profile, create store
  if (founders && account_type === "store_owner") {
    // Verify user actually has founders access
    const check = await sql`
      SELECT subscription_tier, founders_expires_at FROM users WHERE id = ${user.id}
    `;
    if (!check[0] || check[0].subscription_tier !== "founders") {
      return NextResponse.json({ error: "Invalid founders access" }, { status: 403 });
    }

    // Complete profile + create store in one shot
    await sql`
      UPDATE users
      SET account_type = 'store_owner',
          bio = ${(bio || "").slice(0, 300)},
          profile_complete = true,
          store_built = true,
          updated_at = now()
      WHERE id = ${user.id}
    `;

    // Create the store
    if (store_name) {
      const desc = (store_description || bio || "").slice(0, 200);
      const sType = store_type || "existing";
      const sName = store_name.slice(0, 60);
      const assistantOn = true; // All founders get the assistant
      await sql`
        INSERT INTO stores (user_id, store_name, store_description, store_type, assistant_enabled)
        VALUES (${user.id}, ${sName}, ${desc}, ${sType}, ${assistantOn})
        ON CONFLICT (user_id) DO UPDATE SET
          store_name = ${sName},
          store_description = ${desc},
          store_type = ${sType},
          assistant_enabled = ${assistantOn}
      `;
    }

    return NextResponse.json({ ok: true, userId: user.id, store_type: store_type || "existing" });
  }

  // Founders shopper — complete profile immediately
  if (founders && account_type === "shopper") {
    await sql`
      UPDATE users
      SET account_type = 'shopper',
          bio = ${(bio || "").slice(0, 300)},
          profile_complete = true,
          updated_at = now()
      WHERE id = ${user.id}
    `;
    return NextResponse.json({ ok: true });
  }

  // Normal flow: pending = true: store owner pre-subscribe
  const markComplete = !pending;

  await sql`
    UPDATE users
    SET account_type = ${account_type},
        bio = ${(bio || "").slice(0, 300)},
        profile_complete = ${markComplete},
        updated_at = now()
    WHERE id = ${user.id}
  `;

  return NextResponse.json({ ok: true });
}
