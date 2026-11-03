import { NextRequest, NextResponse } from "next/server";
import { getStripe, PRICE_TIERS } from "@/lib/stripe";
import { getSQL } from "@/lib/db";
import Stripe from "stripe";

// Stripe sends raw body — disable Next.js body parsing
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const sql = getSQL();

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured — rejecting webhook");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.mall_user_id;
      const tier = session.metadata?.tier;
      const subscriptionId = session.subscription as string;
      const customerId = session.customer as string;

      if (userId && subscriptionId) {
        // Get the subscription to find the price
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = sub.items.data[0]?.price.id || null;
        const resolvedTier = tier || (priceId && PRICE_TIERS[priceId]?.tier) || null;

        await sql`
          UPDATE users SET
            stripe_customer_id = ${customerId},
            subscription_id = ${subscriptionId},
            subscription_status = 'active',
            subscription_price_id = ${priceId},
            subscription_tier = ${resolvedTier},
            profile_complete = true
          WHERE id = ${userId}
        `;
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const status = sub.status; // active, past_due, canceled, etc.
      const priceId = sub.items.data[0]?.price.id || null;
      const tier = priceId ? PRICE_TIERS[priceId]?.tier || null : null;

      await sql`
        UPDATE users SET
          subscription_status = ${status === "active" || status === "trialing" ? "active" : status},
          subscription_price_id = ${priceId},
          subscription_tier = ${tier},
          subscription_id = ${sub.id}
        WHERE stripe_customer_id = ${customerId}
      `;
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      await sql`
        UPDATE users SET
          subscription_status = 'canceled',
          subscription_tier = NULL,
          subscription_id = NULL,
          subscription_price_id = NULL
        WHERE stripe_customer_id = ${customerId}
      `;
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      await sql`
        UPDATE users SET subscription_status = 'past_due'
        WHERE stripe_customer_id = ${customerId}
      `;
      break;
    }
  }

  return NextResponse.json({ received: true });
}
