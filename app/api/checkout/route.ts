import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getSQL } from "@/lib/db";
import { getStripe, PRICE_TIERS } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { price_id } = await request.json();

  if (!price_id || !PRICE_TIERS[price_id]) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }

  const stripe = getStripe();
  const sql = getSQL();
  const tier = PRICE_TIERS[price_id];

  // Get or create Stripe customer
  let customerId = (user as unknown as Record<string, unknown>).stripe_customer_id as string | null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { mall_user_id: user.id, display_name: user.display_name },
    });
    customerId = customer.id;
    await sql`UPDATE users SET stripe_customer_id = ${customerId} WHERE id = ${user.id}`;
  }

  // Determine success/cancel URLs
  const origin = request.headers.get("origin") || "https://www.themallofprojects.com";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: price_id, quantity: 1 }],
    success_url: `${origin}/?subscribed=1`,
    cancel_url: `${origin}/?canceled=1`,
    metadata: {
      mall_user_id: user.id,
      tier: tier.tier,
    },
  });

  return NextResponse.json({ url: session.url });
}
