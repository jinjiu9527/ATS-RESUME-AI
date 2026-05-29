import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/lemonsqueezy";
import { extractWebhookInfo, updateUserSubscription } from "@/lib/subscription";

/**
 * Lemon Squeezy Webhook Handler
 * Receives order/subscription events and auto-updates user Pro status
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature") || "";

    // 1. 验证签名
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.warn("Webhook signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 2. 解析 payload
    const payload = JSON.parse(rawBody);
    const eventName = payload.meta?.event_name;
    console.log(`Received Lemon Squeezy Webhook: ${eventName}`);

    // 3. 提取用户信息
    const info = extractWebhookInfo(payload);
    if (!info) {
      console.warn("Cannot extract user info from webhook, skipping");
      return NextResponse.json({ received: true });
    }

    // 4. 根据事件类型更新用户计划
    switch (eventName) {
      case "order_created":
      case "subscription_created":
        // 新订单/新订阅 → 升级为 Pro
        await updateUserSubscription({
          userId: info.userId,
          plan: "pro",
          customerId: info.customerId,
          subscriptionId: info.subscriptionId || undefined,
          orderId: info.orderId,
          status: "active",
        });
        console.log(`User ${info.userId} upgraded to Pro`);
        break;

      case "subscription_updated":
        // 订阅状态更新
        await updateUserSubscription({
          userId: info.userId,
          plan: info.status === "active" ? "pro" : "pro",
          status: info.status,
          endsAt: info.endsAt,
        });
        console.log(`User ${info.userId} subscription updated: ${info.status}`);
        break;

      case "subscription_cancelled":
        // 订阅取消（但仍可使用到到期日）
        await updateUserSubscription({
          userId: info.userId,
          plan: "pro", // 仍然 Pro 直到到期
          status: "cancelled",
          endsAt: info.endsAt,
        });
        console.log(`User ${info.userId} subscription cancelled`);
        break;

      case "subscription_expired":
        // 订阅到期 → 降级为 Free
        await updateUserSubscription({
          userId: info.userId,
          plan: "free",
          status: "expired",
          endsAt: null,
        });
        console.log(`User ${info.userId} downgraded to Free`);
        break;

      case "subscription_payment_failed":
        // 续费失败
        await updateUserSubscription({
          userId: info.userId,
          plan: "pro", // 暂时保留 Pro，等待重试
          status: "past_due",
        });
        console.log(`User ${info.userId} payment failed`);
        break;

      default:
        console.log(`Unhandled event type: ${eventName}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
