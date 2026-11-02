import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { getSQL } from "@/lib/db";

// GET — check subscription status
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sql = getSQL();
  const rows = await sql`
    SELECT subscription_status, subscription_tier, subscription_price_id
    FROM users WHERE id = ${user.id}
  `;

  const u = rows[0];
  return NextResponse.json({
    status: u?.subscription_status || null,
    tier: u?.subscription_tier || null,
    priceId: u?.subscription_price_id || null,
    active: u?.subscription_status === "active",
  });
}

// POST — manage (cancel, portal)
export async function POST() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sql = getSQL();
  const rows = await sql`SELECT stripe_customer_id FROM users WHERE id = ${user.id}`;
  const customerId = rows[0]?.stripe_customer_id;

  if (!customerId) {
    return NextResponse.json({ error: "No subscription found" }, { status: 404 });
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: "https://www.themallofprojects.com/",
  });

  return NextResponse.json({ url: session.url });
}
