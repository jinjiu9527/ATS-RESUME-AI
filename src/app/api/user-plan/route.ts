import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserPlan } from "@/lib/subscription";

/**
 * GET /api/user-plan
 * 返回当前用户的计划类型（用于前端判断 Pro 状态）
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ plan: "free" }, { status: 200 });
    }

    const plan = await getUserPlan(userId);
    return NextResponse.json({ plan });
  } catch (error) {
    console.error("获取用户计划失败:", error);
    return NextResponse.json({ plan: "free" }, { status: 200 });
  }
}
