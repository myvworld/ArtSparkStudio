import Stripe from "stripe";
import { db } from "@db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

// Validate required environment variables
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Initialize Stripe with the latest API version
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Subscription price IDs from environment variables
export const SUBSCRIPTION_PRICES = {
  basic: process.env.STRIPE_BASIC_PRICE_ID,
  pro: process.env.STRIPE_PRO_PRICE_ID,
} as const;

// Check if we're in test mode
export const isTestMode = process.env.NODE_ENV !== 'production';

// Log configuration status
console.log('Stripe Configuration:', {
  mode: isTestMode ? 'test' : 'live',
  basic: SUBSCRIPTION_PRICES.basic,
  pro: SUBSCRIPTION_PRICES.pro
});

export async function createStripeCustomer(userId: number, email: string) {
  console.log(`Creating Stripe customer for user ${userId} with email ${email}`);

  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId: userId.toString(),
      mode: isTestMode ? 'test' : 'live'
    },
  });

  await db
    .update(users)
    .set({ stripeCustomerId: customer.id })
    .where(eq(users.id, userId));

  console.log(`Created Stripe customer: ${customer.id}`);
  return customer;
}

export async function createStripeCheckoutSession(userId: number, priceId: string) {
  console.log(`Creating checkout session for user ${userId} with price ${priceId}`);

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new Error("User not found");
  }

  let stripeCustomerId = user.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await createStripeCustomer(userId, user.email);
    stripeCustomerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.APP_URL || 'http://localhost:5000'}/subscription?success=true&mode=${isTestMode ? 'test' : 'live'}`,
    cancel_url: `${process.env.APP_URL || 'http://localhost:5000'}/subscription?canceled=true&mode=${isTestMode ? 'test' : 'live'}`,
    metadata: {
      userId: userId.toString(),
      mode: isTestMode ? 'test' : 'live'
    },
  });

  console.log(`Created checkout session: ${session.id}`);
  return session;
}

export async function handleStripeWebhook(
  signature: string | string[],
  payload: Buffer,
) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is required");
  }

  if (Array.isArray(signature)) {
    signature = signature[0];
  }

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );

    console.log(`Processing Stripe webhook event: ${event.type}`, {
      mode: isTestMode ? 'test' : 'live'
    });

    const { object } = event.data;
    const { customer } = object as any;

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = object as Stripe.Subscription;
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.stripeCustomerId, customer))
          .limit(1);

        if (!user) break;

        // Update subscription tier based on the price ID
        await db
          .update(users)
          .set({
            subscriptionTier: subscription.items.data[0].price.id === SUBSCRIPTION_PRICES.pro ? "pro" : "basic",
          })
          .where(eq(users.id, user.id));

        console.log(`Updated user ${user.id} subscription tier`);
        break;
      }
      case "customer.subscription.deleted": {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.stripeCustomerId, customer))
          .limit(1);

        if (!user) break;

        // Reset subscription tier to free
        await db
          .update(users)
          .set({ subscriptionTier: "free" })
          .where(eq(users.id, user.id));

        console.log(`Reset user ${user.id} to free tier`);
        break;
      }
    }

    return { received: true };
  } catch (err) {
    const error = err as Error;
    console.error("Error processing Stripe webhook:", error);
    throw new Error(`Webhook Error: ${error.message}`);
  }
}