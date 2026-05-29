import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createCheckout } from "@/lib/lemonsqueezy";

export async function POST(req: Request) {
  try {
    // 1. 验证用户登录
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    // 2. 获取用户邮箱
    const { userId: clerkUserId, getToken, sessionClaims } = await auth();
    const userEmail = sessionClaims?.email as string || "";

    // 3. 获取 variant ID
    const body = await req.json();
    const variantId =
      body.variantId || process.env.LEMON_SQUEEZY_PRO_VARIANT_ID;

    if (!variantId) {
      return NextResponse.json(
        { error: "产品配置缺失" },
        { status: 400 }
      );
    }

    // 4. 创建 Lemon Squeezy Checkout
    const checkoutUrl = await createCheckout(
      String(variantId),
      userId,
      userEmail
    );

    return NextResponse.json({ url: checkoutUrl });
  } catch (error: any) {
    console.error("Checkout 创建错误:", error);
    return NextResponse.json(
      { error: error.message || "创建支付链接失败" },
      { status: 500 }
    );
  }
}
