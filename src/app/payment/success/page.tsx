"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PaymentSuccessPage() {
  const { user, isLoaded } = useUser();
  const [status, setStatus] = useState<"loading" | "success" | "timeout">(
    "loading"
  );

  useEffect(() => {
    if (!isLoaded || !user) return;

    let attempts = 0;
    const maxAttempts = 10;

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

    // 首次延迟 3 秒（等待 Webhook 处理）
    const timer = setTimeout(checkPlan, 3000);
    return () => clearTimeout(timer);
  }, [user, isLoaded]);

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
              我们正在确认您的支付状态，请稍候片刻。
            </p>
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
              <ArrowRight
                size={16}
                className="group-hover:translate-x-0.5 transition-transform"
              />
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
              <ArrowRight
                size={16}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
