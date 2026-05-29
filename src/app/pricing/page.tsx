"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { PricingCard } from "@/components/PricingCard";
import { PlanBadge } from "@/components/PlanBadge";
import { Check, Crown, Sparkles } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(false);

  const freeFeatures = [
    { text: "每天 3 次 ATS 检测", included: true },
    { text: "基础匹配分数", included: true },
    { text: "STAR 方法优化", included: true },
    { text: "Markdown 导出", included: true },
    { text: "简历历史保存", included: true },
    { text: "AI 简历优化建议", included: false },
    { text: "ATS 缺失关键词分析", included: false },
    { text: "更详细的匹配报告", included: false },
    { text: "更快分析速度", included: false },
    { text: "无限 ATS 检测", included: false },
  ];

  const proFeatures = [
    { text: "无限 ATS 检测次数", included: true },
    { text: "AI 简历优化建议", included: true },
    { text: "ATS 缺失关键词分析", included: true },
    { text: "更详细的匹配报告", included: true },
    { text: "更快分析速度", included: true },
    { text: "STAR 方法深度优化", included: true },
    { text: "Markdown 导出", included: true },
    { text: "PDF 无限导出", included: true },
    { text: "简历历史保存", included: true },
    { text: "优先支持", included: true },
  ];

  const handleProUpgrade = async () => {
    if (!user) {
      // 未登录：跳转到注册页面
      window.location.href = "/resume";
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "创建支付链接失败");
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (error: any) {
      alert(error.message || "支付系统暂时不可用，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* 导航栏 */}
      <nav className="h-14 border-b bg-white/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-7 h-7 bg-black text-white rounded-md flex items-center justify-center font-bold text-sm">
            A
          </div>
          <span className="font-semibold text-sm tracking-tight">ResumeAI</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/resume"
            className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
          >
            返回应用
          </Link>
        </div>
      </nav>

      {/* 页面标题 */}
      <section className="text-center pt-20 pb-8 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold mb-4">
          <Crown size={12} />
          升级 Pro 解锁全部功能
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-3">
          选择适合你的计划
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto text-base leading-relaxed">
          免费开始使用，随时升级 Pro 解锁无限次数和高级 AI 功能。
        </p>
      </section>

      {/* 定价卡片 */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <PricingCard
            name="免费版"
            price="$0"
            period=""
            description="适合偶尔使用的基础 ATS 检测"
            features={freeFeatures}
            ctaText="免费开始"
            ctaHref="/resume"
          />

          <PricingCard
            name="Pro 版"
            price="$9"
            period="月"
            description="适合求职冲刺的完整 ATS 优化工具"
            features={proFeatures}
            ctaText={loading ? "跳转中..." : "升级 Pro"}
            ctaHref="#"
            highlighted
            onCtaClick={handleProUpgrade}
          />
        </div>

        {/* 保障信息 */}
        <div className="text-center mt-10 space-y-1">
          <p className="text-xs text-gray-400">
            随时取消 · 30 天无理由退款 · 安全支付
          </p>
          <p className="text-xs text-gray-400">
            支付由 Lemon Squeezy 安全处理
          </p>
        </div>
      </section>
    </div>
  );
}
