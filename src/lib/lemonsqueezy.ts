/**
 * Lemon Squeezy API 客户端
 * 处理：创建 Checkout、验证 Webhook 签名、查询订阅
 */

import crypto from "crypto";

// ---- 类型定义 ----

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

// ---- 创建 Checkout ----

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
          receipt_button_text: "返回 ResumeAI",
          receipt_thank_you_note: "感谢升级 Pro 会员！现在您可以无限使用所有高级功能。",
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
    console.error("LS Checkout 创建失败:", err);
    throw new Error("创建支付链接失败，请稍后重试");
  }

  const result = await response.json();
  return result.data.attributes.url;
}

// ---- 验证 Webhook 签名 ----

export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  try {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(rawBody);
    const expected = hmac.digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

// ---- 获取订阅详情 ----

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
