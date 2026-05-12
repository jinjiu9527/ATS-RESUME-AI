// src/app/page.tsx
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black px-4">
      {/* Main Heading: Bold and Impactful */}
      <h1 className="text-5xl font-extrabold mb-6 tracking-tight text-center">
        AI Resume Builder
      </h1>
      
      {/* Subheading: Professional and Generalist */}
      <p className="text-slate-500 text-xl mb-10 max-w-2xl text-center leading-relaxed">
        Powered by DeepSeek AI to generate ATS-friendly resumes that meet North American standards.
        <br />
        Empowering professionals across all industries to land their dream global careers.
      </p>

      {/* Primary Call to Action */}
      <Link 
        href="/resume" 
        className="px-10 py-4 bg-black text-white rounded-full font-bold hover:bg-slate-800 transition-all shadow-xl hover:scale-105 active:scale-95"
      >
        Get Started — It's Free
      </Link>

      {/* Trust Badges / Features */}
      <p className="mt-6 text-sm text-slate-400">
        STAR Method Optimization · Markdown Export · 100% Privacy Protected
      </p>
    </div>
  );
}