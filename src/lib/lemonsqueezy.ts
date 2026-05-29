/**
 * Lemon Squeezy API Client
 * Handles: Checkout creation, Webhook signature verification, Subscription queries
 */

import crypto from "crypto";

// ---- Types ----

export interface LSCheckoutAttributes {
  store_id: number;
  variant_id: number;
  url: string;
  expires_at: string;
  created_at: string;
  test_mode: boolean;
}

export interface LSWebhookPayload {
  meta: {
    test_mode: boolean;
    event_name: string;
    custom_data?: Record<string, any>;
  };
  data: {
    id: string;
    type: string;
    attributes: Record<string, any>;
    relationships?: Record<string, any>;
  };
}

// ---- Create Checkout ----

export async function createCheckout(
  variantId: string,
  userId: string,
  userEmail: string
): Promise<string> {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!apiKey || !storeId) {
    throw new Error("Lemon Squeezy API Key or Store ID is missing in env vars");
  }

  const body = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          email: userEmail,
          custom: { user_id: userId },
        },
        product_options: {
          redirect_url: `${appUrl}/payment/success`,
          receipt_button_text: "Back to ResumeAI",
          receipt_thank_you_note: "Thank you for upgrading to Pro! You now have unlimited access to all premium features.",
        },
      },
      relationships: {
        store: {
          data: { type: "stores", id: storeId },
        },
        variant: {
          data: { type: "variants", id: variantId },
        },
      },
    },
  };

  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("LS Checkout creation failed:", err);
    throw new Error("Failed to create checkout. Please try again later.");
  }

  const result = await response.json();
  return result.data.attributes.url;
}

// ---- Verify Webhook Signature ----
// Lemon Squeezy signature format: X-Signature: t=timestamp,v1=hex_hmac
// HMAC computed as: SHA256(secret, timestamp + "." + raw_body)

export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  try {
    // Parse header: "t=1717539200,v1=abcd1234..."
    const parts: Record<string, string> = {};
    signature.split(",").forEach((part) => {
      const [key, val] = part.split("=");
      if (key && val) parts[key] = val;
    });

    const timestamp = parts["t"];
    const hash = parts["v1"];

    if (!timestamp || !hash) {
      // Fallback: simple HMAC over raw body
      const hmac = crypto.createHmac("sha256", secret);
      hmac.update(rawBody);
      const expected = hmac.digest("hex");
      return crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(signature)
      );
    }

    // Standard format: HMAC(timestamp + "." + raw_body)
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(`${timestamp}.${rawBody}`);
    const expected = hmac.digest("hex");

    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hash));
  } catch {
    return false;
  }
}

// ---- Get Subscription ----

export async function getSubscription(subscriptionId: string) {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  if (!apiKey) throw new Error("Missing LS API key");

  const res = await fetch(
    `https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`,
    {
      headers: {
        Accept: "application/vnd.api+json",
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  if (!res.ok) return null;
  const json = await res.json();
  return json.data;
}
