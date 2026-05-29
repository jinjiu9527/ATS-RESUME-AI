"use client";

import { Crown, Zap } from "lucide-react";

interface PlanBadgeProps {
  plan: "free" | "pro";
  size?: "sm" | "md";
}

export function PlanBadge({ plan, size = "sm" }: PlanBadgeProps) {
  if (plan === "pro") {
    return (
      <span
        className={`inline-flex items-center gap-1 font-bold rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white ${
          size === "sm" ? "px-2.5 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
        }`}
      >
        <Crown size={size === "sm" ? 10 : 12} />
        PRO
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full bg-gray-100 text-gray-500 border border-gray-200 ${
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs"
      }`}
    >
      <Zap size={size === "sm" ? 10 : 12} />
      Free
    </span>
  );
}
