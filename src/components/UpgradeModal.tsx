"use client";

import { Crown, X, Sparkles, Zap, TrendingUp, FileText } from "lucide-react";
import { useState } from "react";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  currentUsage: number;
  dailyLimit: number;
  onUpgrade: () => void;
}

export function UpgradeModal({
  open,
  onClose,
  currentUsage,
  dailyLimit,
  onUpgrade,
}: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    await onUpgrade();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 fade-in">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/25">
          <Crown size={24} className="text-white" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Free Limit Reached
        </h2>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          You've used{" "}
          <span className="font-bold text-gray-900">{currentUsage}/{dailyLimit}</span>{" "}
          free ATS scans today. Upgrade to Pro for unlimited scans and premium features.
        </p>

        {/* Pro benefits */}
        <div className="space-y-2.5 mb-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
          {[
            { icon: Zap, text: "Unlimited ATS scans" },
            { icon: Sparkles, text: "AI optimization suggestions" },
            { icon: TrendingUp, text: "Missing keyword analysis" },
            { icon: FileText, text: "Detailed match reports" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 text-sm text-gray-700">
              <item.icon size={14} className="text-amber-500 shrink-0" />
              {item.text}
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span> Redirecting...
              </>
            ) : (
              <>
                <Crown size={16} /> Upgrade to Pro — $9/mo
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl font-medium text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
