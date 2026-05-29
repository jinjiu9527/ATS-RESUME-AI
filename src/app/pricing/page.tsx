"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { PricingCard } from "@/components/PricingCard";
import { Crown } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const freeFeatures = [
    { text: "3 ATS scans per day", included: true },
    { text: "Basic match score", included: true },
    { text: "STAR method optimization", included: true },
    { text: "Markdown export", included: true },
    { text: "Resume history", included: true },
    { text: "AI optimization suggestions", included: false },
    { text: "Missing keyword analysis", included: false },
    { text: "Detailed match reports", included: false },
    { text: "Priority processing", included: false },
    { text: "Unlimited ATS scans", included: false },
  ];

  const proFeatures = [
    { text: "Unlimited ATS scans", included: true },
    { text: "AI optimization suggestions", included: true },
    { text: "Missing keyword analysis", included: true },
    { text: "Detailed match reports", included: true },
    { text: "Priority processing", included: true },
    { text: "Deep STAR optimization", included: true },
    { text: "Markdown export", included: true },
    { text: "Unlimited PDF exports", included: true },
    { text: "Resume history", included: true },
    { text: "Priority support", included: true },
  ];

  const handleProUpgrade = async () => {
    if (!user) {
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
        throw new Error(err.error || "Failed to create checkout");
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (error: any) {
      alert(error.message || "Payment system unavailable, please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Nav */}
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
            Back to App
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section className="text-center pt-20 pb-8 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold mb-4">
          <Crown size={12} />
          Upgrade to Pro
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-3">
          Choose Your Plan
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto text-base leading-relaxed">
          Start free. Upgrade to Pro anytime to unlock unlimited scans and advanced AI features.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <PricingCard
            name="Free"
            price="$0"
            period=""
            description="Basic ATS scanning for casual use"
            features={freeFeatures}
            ctaText="Get Started"
            ctaHref="/resume"
          />

          <PricingCard
            name="Pro"
            price="$9"
            period="month"
            description="Complete ATS optimization for serious job seekers"
            features={proFeatures}
            ctaText={loading ? "Redirecting..." : "Upgrade to Pro"}
            ctaHref="#"
            highlighted
            onCtaClick={handleProUpgrade}
          />
        </div>

        {/* Guarantees */}
        <div className="text-center mt-10 space-y-1">
          <p className="text-xs text-gray-400">
            Cancel anytime · 30-day money-back guarantee · Secure payment
          </p>
          <p className="text-xs text-gray-400">
            Payments processed securely by Lemon Squeezy
          </p>
        </div>
      </section>
    </div>
  );
}
