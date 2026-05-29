"use client";

import { XCircle, ArrowRight, RotateCcw } from "lucide-react";
import Link from "next/link";

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
          <XCircle size={32} className="text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          You cancelled the payment. No worries — you can try again anytime.
        </p>
        <div className="space-y-3">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm bg-black text-white hover:bg-gray-800 transition-all shadow-lg group w-full justify-center"
          >
            <RotateCcw size={16} />
            Choose a Plan
          </Link>
          <Link
            href="/resume"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-medium text-sm text-gray-600 hover:text-black transition-colors w-full justify-center"
          >
            Back to App
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
