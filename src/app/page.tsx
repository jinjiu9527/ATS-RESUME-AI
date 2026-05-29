import Link from "next/link";
import { Crown, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black px-4">
      {/* 顶部导航 */}
      <nav className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-black text-white rounded-md flex items-center justify-center font-bold text-sm">
            A
          </div>
          <span className="font-semibold text-sm tracking-tight">ResumeAI</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/pricing"
            className="text-sm font-medium text-gray-500 hover:text-black transition-colors"
          >
            定价
          </Link>
          <Link
            href="/resume"
            className="text-sm font-medium text-white bg-black px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            开始使用
          </Link>
        </div>
      </nav>

      {/* 主标题 */}
      <h1 className="text-5xl font-extrabold mb-6 tracking-tight text-center">
        AI Resume Builder
      </h1>

      {/* 副标题 */}
      <p className="text-slate-500 text-xl mb-10 max-w-2xl text-center leading-relaxed">
        Powered by DeepSeek AI to generate ATS-friendly resumes that meet North
        American standards.
        <br />
        Empowering professionals across all industries to land their dream
        global careers.
      </p>

      {/* CTA 按钮组 */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/resume"
          className="px-10 py-4 bg-black text-white rounded-full font-bold hover:bg-slate-800 transition-all shadow-xl hover:scale-105 active:scale-95"
        >
          Get Started — It's Free
        </Link>
        <Link
          href="/pricing"
          className="px-8 py-4 border border-gray-200 rounded-full font-semibold text-gray-700 hover:border-amber-400 hover:text-amber-600 transition-all flex items-center gap-2 group"
        >
          <Crown size={16} className="text-amber-500" />
          View Pro
          <ArrowRight
            size={14}
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </Link>
      </div>

      {/* 特色标语 */}
      <p className="mt-4 text-sm text-slate-400">
        STAR Method Optimization · Markdown Export · 100% Privacy Protected
      </p>
    </div>
  );
}
