import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import {
  LETTY_PRICE_CENTS,
  getChallengeState,
  grantPaidCredit,
  recordPurchase,
  resolveIdentity,
} from "@/lib/letty-challenge";

export const runtime = "nodejs";

/**
 * Confirms a $1.99 checkout when Stripe sends the buyer back.
 * Idempotent: one credit per checkout session, no matter how many times it's called.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionId = new URL(request.url).searchParams.get("session_id") || "";
  if (!sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "Missing checkout session" }, { status: 400 });
  }

  const stripe = getStripe();
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return NextResponse.json({ error: "Checkout not found" }, { status: 404 });
  }

  const ownerId = session.metadata?.mall_user_id;
  const paid = session.payment_status === "paid" && session.mode === "payment";

  if (!paid || ownerId !== user.id || (session.amount_total ?? 0) < LETTY_PRICE_CENTS) {
    return NextResponse.json({ error: "Payment not confirmed" }, { status: 402 });
  }

  const firstTime = await recordPurchase(sessionId, user.id, session.amount_total ?? LETTY_PRICE_CENTS);
  if (firstTime) {
    await grantPaidCredit(user.id);
  }

  const identity = resolveIdentity(user.id, null);

  return NextResponse.json({
    granted: firstTime,
    state: await getChallengeState(identity.key),
  });
}
