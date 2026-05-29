import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/lemonsqueezy";
import { extractWebhookInfo, updateUserSubscription } from "@/lib/subscription";

/**
 * Lemon Squeezy Webhook 处理器
 * 接收订单创建、订阅状态变更等事件，自动更新用户 Pro 状态
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature") || "";

    // 1. 验证签名
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.warn("Webhook 签名验证失败");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 2. 解析 payload
    const payload = JSON.parse(rawBody);
    const eventName = payload.meta?.event_name;
    console.log(`收到 Lemon Squeezy Webhook: ${eventName}`);

    // 3. 提取用户信息
    const info = extractWebhookInfo(payload);
    if (!info) {
      console.warn("无法从 Webhook 中提取用户信息，跳过处理");
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
        console.log(`用户 ${info.userId} 升级为 Pro`);
        break;

      case "subscription_updated":
        // 订阅状态更新
        await updateUserSubscription({
          userId: info.userId,
          plan: info.status === "active" ? "pro" : "pro",
          status: info.status,
          endsAt: info.endsAt,
        });
        console.log(`用户 ${info.userId} 订阅更新: ${info.status}`);
        break;

      case "subscription_cancelled":
        // 订阅取消（但仍可使用到到期日）
        await updateUserSubscription({
          userId: info.userId,
          plan: "pro", // 仍然 Pro 直到到期
          status: "cancelled",
          endsAt: info.endsAt,
        });
        console.log(`用户 ${info.userId} 订阅已取消`);
        break;

      case "subscription_expired":
        // 订阅到期 → 降级为 Free
        await updateUserSubscription({
          userId: info.userId,
          plan: "free",
          status: "expired",
          endsAt: null,
        });
        console.log(`用户 ${info.userId} 降级为 Free`);
        break;

      case "subscription_payment_failed":
        // 续费失败
        await updateUserSubscription({
          userId: info.userId,
          plan: "pro", // 暂时保留 Pro，等待重试
          status: "past_due",
        });
        console.log(`用户 ${info.userId} 续费失败`);
        break;

      default:
        console.log(`未处理的事件类型: ${eventName}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook 处理错误:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
