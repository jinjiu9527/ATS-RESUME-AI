"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PaymentSuccessContent() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const checkoutId = searchParams.get("checkout_id");
  const [status, setStatus] = useState<"loading" | "success" | "timeout">(
    "loading"
  );

  useEffect(() => {
    // 等待 Clerk 加载完成
    if (!isLoaded) return;

    let attempts = 0;
    const maxAttempts = 15;

    const checkPlan = async () => {
      try {
        const res = await fetch("/api/user-plan");
        if (res.ok) {
          const { plan } = await res.json();
          if (plan === "pro") {
            setStatus("success");
            return;
          }
        }
      } catch {
        // 继续轮询
      }

      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(checkPlan, 2000);
      } else {
        setStatus("timeout");
      }
    };

    // 首次延迟 3 秒（等待 Webhook）
    const timer = setTimeout(checkPlan, 3000);
    return () => clearTimeout(timer);
  }, [isLoaded, checkoutId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
      <div className="text-center max-w-md">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
              <Loader2 size={32} className="text-amber-500 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              正在确认支付...
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              {isLoaded && !user
                ? "支付已完成，请登录后查看您的 Pro 状态。"
                : "我们正在确认您的支付状态，请稍候片刻。"}
            </p>
            {isLoaded && !user && (
              <Link
                href="/resume"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm bg-black text-white hover:bg-gray-800 transition-all shadow-lg group mt-6"
              >
                登录账户
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center animate-in zoom-in">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              支付成功！
            </h1>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              欢迎成为 Pro 会员！现在您可以无限使用所有高级功能。
            </p>
            <Link
              href="/resume"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm bg-black text-white hover:bg-gray-800 transition-all shadow-lg group"
            >
              开始使用 Pro 功能
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </>
        )}

        {status === "timeout" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              支付处理中
            </h1>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              您的支付正在处理中，会员状态将在几分钟内更新。如有问题请联系支持。
            </p>
            <Link
              href="/resume"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm bg-black text-white hover:bg-gray-800 transition-all shadow-lg group"
            >
              返回应用
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-gray-400" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
