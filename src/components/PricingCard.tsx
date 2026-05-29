"use client";

import { cn } from "@/lib/utils";
import { Check, X, ArrowRight } from "lucide-react";

interface PricingFeature {
  text: string;
  included: boolean;
}

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: PricingFeature[];
  ctaText: string;
  ctaHref: string;
  highlighted?: boolean;
  onCtaClick?: () => void;
}

export function PricingCard({
  name,
  price,
  period,
  description,
  features,
  ctaText,
  ctaHref,
  highlighted = false,
  onCtaClick,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border p-8 transition-all duration-300",
        highlighted
          ? "border-amber-400/50 bg-gradient-to-b from-amber-50/50 to-white shadow-xl shadow-amber-500/10 scale-[1.02]"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg"
      )}
    >
      {/* Pro 高亮标签 */}
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold shadow-lg shadow-amber-500/30">
            推荐
          </span>
        </div>
      )}

      {/* 计划名称 */}
      <h3 className="text-lg font-bold text-gray-900 mb-1">{name}</h3>
      <p className="text-sm text-gray-500 mb-5">{description}</p>

      {/* 价格 */}
      <div className="mb-6">
        <span className="text-4xl font-black text-gray-900 tracking-tight">
          {price}
        </span>
        {period && (
          <span className="text-sm text-gray-400 ml-1">/{period}</span>
        )}
      </div>

      {/* CTA 按钮 */}
      {highlighted ? (
        <button
          onClick={onCtaClick}
          className="w-full py-3 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 group"
        >
          {ctaText}
          <ArrowRight
            size={16}
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </button>
      ) : (
        <a
          href={ctaHref}
          className="w-full py-3 px-6 rounded-xl font-bold text-sm bg-gray-900 text-white hover:bg-gray-800 transition-all text-center block"
        >
          {ctaText}
        </a>
      )}

      {/* 功能列表 */}
      <div className="mt-8 space-y-3">
        {features.map((feature, i) => (
          <div key={i} className="flex items-start gap-3">
            {feature.included ? (
              <Check
                size={16}
                className="text-green-500 shrink-0 mt-0.5"
              />
            ) : (
              <X size={16} className="text-gray-300 shrink-0 mt-0.5" />
            )}
            <span
              className={cn(
                "text-sm",
                feature.included ? "text-gray-700" : "text-gray-400"
              )}
            >
              {feature.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
