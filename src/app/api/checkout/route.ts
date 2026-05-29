import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createCheckout } from "@/lib/lemonsqueezy";

export async function POST(req: Request) {
  try {
    // 1. Verify user login
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Login required" },
        { status: 401 }
      );
    }

    // Fetch user email from Clerk (not available in sessionClaims by default)
    const clerkUser = await (await clerkClient()).users.getUser(userId);
    const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress || "";

    // 2. Get variant ID (request body override, fallback to env var)
    let variantId = process.env.LEMON_SQUEEZY_PRO_VARIANT_ID;
    try {
      const body = await req.json();
      if (body.variantId) variantId = body.variantId;
    } catch { /* body is empty, use default */ }

    if (!variantId) {
      return NextResponse.json(
        { error: "Product configuration missing. Check LEMON_SQUEEZY_PRO_VARIANT_ID." },
        { status: 400 }
      );
    }

    // 3. Create Lemon Squeezy Checkout
    const checkoutUrl = await createCheckout(
      String(variantId),
      userId,
      userEmail
    );

    return NextResponse.json({ url: checkoutUrl });
  } catch (error: any) {
    console.error("Checkout creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout" },
      { status: 500 }
    );
  }
}
