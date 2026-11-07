import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

// Price ID → tier mapping
export const PRICE_TIERS: Record<string, { tier: string; label: string }> = {
  "price_1UXSk22ctK45EjG7uQa1FKw0": { tier: "shopper", label: "Shopper · $9.99/mo" },
  "price_1UX2Mh2ctK45EjG7Cd3NbKEA": { tier: "owner_basic", label: "Store Owner · $19.99/mo" },
  "price_1UX2OC2ctK45EjG7hBCsExY2": { tier: "owner_basic", label: "Store Owner · $99.99/6mo" },
  "price_1UX2PM2ctK45EjG7AcZfFxLT": { tier: "owner_basic", label: "Store Owner · $149.99/yr" },
  "price_1UXScd2ctK45EjG7QbTNoaey": { tier: "owner_assistant", label: "Store Owner + Assistant · $29.99/mo" },
};

// Shopper price
export const SHOPPER_PRICE_ID = "price_1UXSk22ctK45EjG7uQa1FKw0";

// Owner prices
export const OWNER_PRICES = {
  monthly: "price_1UX2Mh2ctK45EjG7Cd3NbKEA",
  sixMonth: "price_1UX2OC2ctK45EjG7hBCsExY2",
  yearly: "price_1UX2PM2ctK45EjG7AcZfFxLT",
  assistant: "price_1UXScd2ctK45EjG7QbTNoaey",
};
