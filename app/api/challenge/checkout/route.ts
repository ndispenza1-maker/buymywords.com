import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getSQL } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { isRateLimited } from "@/lib/security";
import { LETTY_PRICE_CENTS } from "@/lib/letty-challenge";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Log in to buy another try." }, { status: 401 });
  }

  if (isRateLimited(`letty-checkout:${user.id}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Wait a few minutes." }, { status: 429 });
  }

  const stripe = getStripe();
  const sql = getSQL();

  let customerId = (user as unknown as Record<string, unknown>).stripe_customer_id as string | null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { mall_user_id: user.id, display_name: user.display_name },
    });
    customerId = customer.id;
    await sql`UPDATE users SET stripe_customer_id = ${customerId} WHERE id = ${user.id}`;
  }

  const origin = request.headers.get("origin") || "https://www.themallofprojects.com";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: LETTY_PRICE_CENTS,
          product_data: {
            name: "Letty's Challenge — one more try",
            description: "One additional sanctioned attempt in the ring.",
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/?letty_paid=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?letty_cancel=1`,
    metadata: {
      kind: "letty_credit",
      mall_user_id: user.id,
    },
  });

  return NextResponse.json({ url: session.url });
}
