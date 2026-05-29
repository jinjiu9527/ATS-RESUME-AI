import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createCheckout } from "@/lib/lemonsqueezy";

export async function POST(req: Request) {
  try {
    // 1. 验证用户登录
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    const userEmail = (sessionClaims?.email as string) ||
                      (sessionClaims?.emailAddress as string) || "";

    // 2. 获取 variant ID（优先用请求体，否则用环境变量）
    let variantId = process.env.LEMON_SQUEEZY_PRO_VARIANT_ID;
    try {
      const body = await req.json();
      if (body.variantId) variantId = body.variantId;
    } catch { /* body 为空时使用默认值 */ }

    if (!variantId) {
      return NextResponse.json(
        { error: "产品配置缺失，请检查 LEMON_SQUEEZY_PRO_VARIANT_ID" },
        { status: 400 }
      );
    }

    // 3. 创建 Lemon Squeezy Checkout
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
