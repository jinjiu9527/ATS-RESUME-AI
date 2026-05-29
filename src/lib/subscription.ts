/**
 * 订阅管理工具
 * 处理用户计划查询、Pro 状态检查、Webhook 更新
 */

import { supabase, supabaseAdmin } from "@/lib/supabase";

// ---- 常量 ----

export const FREE_DAILY_LIMITS = {
  resume: 3,
  pdf: 1,
} as const;

export const PRO_DAILY_LIMITS = {
  resume: Infinity,
  pdf: Infinity,
} as const;

// ---- 获取用户计划 ----

export async function getUserPlan(
  userId: string
): Promise<"free" | "pro"> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  return profile?.plan === "pro" ? "pro" : "free";
}

// ---- 检查是否为 Pro ----

export async function isUserPro(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  return plan === "pro";
}

// ---- 获取限制 ----

export async function getUserLimits(userId: string) {
  const plan = await getUserPlan(userId);
  return plan === "pro" ? PRO_DAILY_LIMITS : FREE_DAILY_LIMITS;
}

// ---- Webhook: 更新用户订阅（使用 service role 绕过 RLS） ----

export async function updateUserSubscription(params: {
  userId: string;
  plan: "free" | "pro";
  customerId?: string;
  subscriptionId?: string;
  orderId?: string;
  status?: string;
  endsAt?: string | null;
}) {
  const client = supabaseAdmin || supabase;

  const update: Record<string, any> = {
    plan: params.plan,
    last_reset_date: new Date().toISOString().split("T")[0],
  };

  if (params.customerId !== undefined)
    update.lemon_squeezy_customer_id = params.customerId;
  if (params.subscriptionId !== undefined)
    update.lemon_squeezy_subscription_id = params.subscriptionId;
  if (params.orderId !== undefined)
    update.lemon_squeezy_order_id = params.orderId;
  if (params.status !== undefined)
    update.subscription_status = params.status;
  if (params.endsAt !== undefined)
    update.subscription_ends_at = params.endsAt;

  const { error } = await client
    .from("profiles")
    .upsert({ id: params.userId, ...update }, { onConflict: "id" });

  if (error) {
    console.error("更新用户订阅失败:", error);
    throw new Error("订阅更新失败");
  }
}

// ---- 从 Webhook Payload 提取关键信息 ----

export interface WebhookUserInfo {
  userId: string;
  customerId: string;
  subscriptionId: string | null;
  orderId: string;
  status: string;
  endsAt: string | null;
}

export function extractWebhookInfo(payload: any): WebhookUserInfo | null {
  const eventName = payload.meta?.event_name;
  const customData = payload.meta?.custom_data;
  const userId = customData?.user_id;

  if (!userId) {
    console.warn("Webhook 缺少 custom_data.user_id");
    return null;
  }

  const attrs = payload.data?.attributes || {};

  const customerId = String(
    attrs.customer_id || payload.data?.relationships?.customer?.data?.id || ""
  );

  let subscriptionId: string | null = null;
  if (attrs.subscription_id) {
    subscriptionId = String(attrs.subscription_id);
  } else if (attrs.first_subscription_item?.subscription_id) {
    subscriptionId = String(attrs.first_subscription_item.subscription_id);
  }

  const orderId = String(payload.data?.id || "");

  // 根据事件类型映射计划状态
  let plan: "pro" | "free" = "pro";
  let status = attrs.status || "active";

  switch (eventName) {
    case "subscription_cancelled":
    case "subscription_expired":
      plan = "free";
      status = eventName === "subscription_expired" ? "expired" : "cancelled";
      break;
    case "subscription_payment_failed":
      status = "past_due";
      break;
    case "order_created":
    case "subscription_created":
    case "subscription_updated":
    case "subscription_payment_success":
    default:
      plan = "pro";
      break;
  }

  return {
    userId,
    customerId,
    subscriptionId,
    orderId,
    status,
    endsAt: attrs.ends_at || null,
  };
}
