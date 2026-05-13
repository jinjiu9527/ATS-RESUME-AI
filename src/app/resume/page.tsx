"use client";

import { useUser } from "@clerk/nextjs";
import { saveResume, getResumes, deleteResume, type Resume } from "@/app/actions/resume";
import { useState, useRef, useEffect } from "react";
import "./print.css";
import {
  Loader2, Download, Trash2,
  Sparkles, History, X, CheckCircle2,
} from "lucide-react";

export default function ATSResumeOptimizer() {
  const resumeRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  const [formData, setFormData] = useState({
    name: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
    experience: "",
    skills: "",
    education: "",
    jobDescription: "",
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting]   = useState(false);
  const [history, setHistory]           = useState<any[]>([]);
  const [showHistory, setShowHistory]   = useState(false);

  const [atsResult, setAtsResult] = useState({
    score: 0,
    missingKeywords: [] as string[],
    suggestions: [] as string[],
    recruiterInsight: "Awaiting job description to provide recruiter insights.",
    hasOptimized: false,
  });

  useEffect(() => {
    const initHistory = async () => {
      if (user?.id) {
        try {
          const data = await getResumes(user.id);
          setHistory(data);
        } catch (error) {
          console.error("Failed to sync history:", error);
        }
      }
    };
    initHistory();
  }, [user?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ---- Export PDF：把表单数据拼进 query string 传给 Puppeteer route ----
  const handleExportPDF = () => {
    setIsExporting(true);
    const params = new URLSearchParams();
    Object.entries(formData).forEach(([key, val]) => {
      if (val) params.set(key, val);
    });
    // 在新标签打开，浏览器会自动触发下载
    window.open(`/api/export-pdf?${params.toString()}`, "_blank");
    // 给用户一点反馈时间
    setTimeout(() => setIsExporting(false), 2000);
  };

  const handleAiOptimize = async () => {
    if (!formData.experience) return alert("Please input some experience to optimize.");
    setIsGenerating(true);

    try {
      const res = await fetch("/api/generate-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (result.success && result.data) {
       const d = result.data;
setFormData(prev => ({
  ...prev,
  summary:    d.optimizedSummary    || prev.summary,
  experience: d.optimizedExperience || prev.experience,
  skills:     d.optimizedSkills     || prev.skills,
  education:  d.optimizedEducation  || prev.education,
}));

        setAtsResult({
          score:           result.data.score            || 0,
          missingKeywords: result.data.missingKeywords  || [],
          suggestions:     result.data.suggestions      || [],
          recruiterInsight: result.data.recruiterInsight || "Looks good!",
          hasOptimized:    true,
        });

        saveToHistory(JSON.stringify(d));
      } else {
        console.error("Optimization failed:", result);
        alert("AI return format error. Please check console.");
      }
    } catch (error) {
  console.error(error);
  alert(error instanceof Error ? error.message : "AI Optimization encountered an issue.");
   } finally {
      setIsGenerating(false);
    }
  };

  const saveToHistory = async (aiContent: string) => {
    if (!user?.id) return;
    const newResume: Resume = {
      user_id:  user.id,
      name:     formData.title || "Untitled Engineer",
      position: formData.title || "Software Engineer",
      content:  aiContent,
    };
    try {
      const savedData = await saveResume(newResume);
      if (savedData) setHistory((prev) => [savedData, ...prev]);
    } catch (error) {
      console.error("Cloud save failed:", error);
    }
  };

  const deleteHistoryRecord = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id || !confirm("Delete this resume?")) return;
    try {
      await deleteResume(id);
      setHistory((prev) => prev.filter((item: any) => item.id !== id));
    } catch {
      alert("Failed to delete.");
    }
  };const stripMarkdown = (str: string) =>
  str
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/`(.*?)`/g, "$1");

  return (
    <div className="flex flex-col h-screen overflow-hidden relative">

      {/* 顶部导航栏 */}
      <nav className="h-14 border-b bg-white flex items-center justify-between px-6 shrink-0 print:hidden z-20">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-black text-white rounded-md flex items-center justify-center font-bold text-sm">
            A
          </div>
          <span className="font-semibold text-sm tracking-tight">ATS Optimizer Pro</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-black transition-colors"
          >
            <History size={14} /> My Resumes
          </button>
          {/* ✅ 修复：传递表单数据给 Puppeteer */}
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="bg-black text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-800 disabled:bg-gray-400 transition-all flex items-center gap-1.5 shadow-sm"
          >
            {isExporting
              ? <><Loader2 size={14} className="animate-spin" /> Exporting...</>
              : <><Download size={14} /> Export PDF</>
            }
          </button>
        </div>
      </nav>

      {/* 主体三栏布局 */}
      <main className="flex-1 flex overflow-hidden">

        {/* 左侧：Input Panel */}
        <section className="w-[400px] border-r bg-white overflow-y-auto scrollbar-hide flex flex-col print:hidden">
          <div className="p-6 space-y-8 flex-1">

            {/* 1. Personal Info */}
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4">1. Personal Information</h2>
              <div className="space-y-3">
                <input name="name" value={formData.name} onChange={handleChange} placeholder="Full Name"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none transition-all" />
                <div className="grid grid-cols-2 gap-3">
                  <input name="email" value={formData.email} onChange={handleChange} placeholder="Email"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none transition-all" />
                  <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input name="location" value={formData.location} onChange={handleChange} placeholder="Location (City, ST)"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none transition-all" />
                  <input name="title" value={formData.title} onChange={handleChange} placeholder="Target Role"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none transition-all border-l-4 border-l-blue-500" />
                </div>
              </div>
            </div>

            {/* 2. Core Content */}
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4">2. Core Content</h2>
              <div className="space-y-4">
                <textarea name="summary" value={formData.summary} onChange={handleChange}
                  placeholder="Professional Summary..." rows={3}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none transition-all resize-none" />
                <textarea name="experience" value={formData.experience} onChange={handleChange}
                  placeholder="Professional Experience (Paste your raw bullet points here)..." rows={6}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none transition-all resize-y" />
                <textarea name="skills" value={formData.skills} onChange={handleChange}
                  placeholder="Skills (Comma separated)" rows={2}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none transition-all resize-none" />
                <textarea name="education" value={formData.education} onChange={handleChange}
                  placeholder="Education (e.g. B.S. Computer Science, University...)" rows={2}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none transition-all resize-none" />
              </div>
            </div>

            {/* 3. Target Job Description */}
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-blue-600 mb-2 flex items-center gap-1">
                <Sparkles size={12} /> 3. Target Job Description
              </h2>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">Paste the JD to get keyword optimization and ATS matching.</p>
              <textarea name="jobDescription" value={formData.jobDescription} onChange={handleChange}
                placeholder="Paste job description from LinkedIn, Indeed..." rows={5}
                className="w-full px-3 py-2 bg-white border border-blue-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-y placeholder:text-gray-300" />
            </div>

          </div>

          {/* Optimize Button */}
          <div className="p-6 border-t bg-white shrink-0">
            <button
              onClick={handleAiOptimize}
              disabled={isGenerating}
              className="w-full bg-black text-white py-3.5 rounded-xl font-bold text-sm hover:bg-gray-800 disabled:bg-gray-300 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10"
            >
              {isGenerating
                ? <><Loader2 size={16} className="animate-spin" /> Analyzing...</>
                : <><Sparkles size={16} /> Optimize for ATS</>
              }
            </button>
          </div>
        </section>

        {/* 中间：Resume Preview */}
        <section className="flex-1 bg-[#F3F4F6] overflow-y-auto p-10 flex justify-center print:p-0 print:bg-white">
          <div
            ref={resumeRef}
            className="bg-white shadow-2xl p-[0.75in] text-[#111] print:shadow-none print:w-full print:h-auto"
            style={{ width: "8.5in", minHeight: "11in" }}
          >
            {/* Header */}
            <div className="text-center border-b-[1.5px] border-black pb-4 mb-4">
              <h1 className="text-[28px] font-serif font-bold uppercase tracking-widest mb-1 leading-none">
                {formData.name || "JOHN DOE"}
              </h1>
              <div className="text-[11px] font-sans flex justify-center items-center gap-2 text-gray-800 uppercase tracking-wider">
                {formData.location && <span>{formData.location}</span>}
                {formData.location && (formData.phone || formData.email) && <span>|</span>}
                {formData.phone && <span>{formData.phone}</span>}
                {formData.phone && formData.email && <span>|</span>}
                {formData.email && <span>{formData.email}</span>}
              </div>
            </div>

            {/* Summary */}
            {(formData.summary || atsResult.hasOptimized) && (
              <div className="mb-4">
                <h3 className="text-[12px] font-bold border-b border-gray-300 mb-2 uppercase tracking-widest text-black">
                  Professional Summary
                </h3>
                <p className="text-[11px] leading-[1.6] text-justify text-gray-800">
                  { stripMarkdown(formData.summary) || "Results-driven professional with a proven track record of..."}
                </p>
              </div>
            )}

            {/* Experience */}
            <div className="mb-4">
              <h3 className="text-[12px] font-bold border-b border-gray-300 mb-2 uppercase tracking-widest text-black">
                Experience
              </h3>
              <div className="text-[11px] leading-[1.6] text-gray-800 whitespace-pre-wrap">
                {stripMarkdown(formData.experience) || "Your optimized professional experience will be structured here."}
              </div>
            </div>

            {/* Skills */}
            {formData.skills && (
              <div className="mb-4">
                <h3 className="text-[12px] font-bold border-b border-gray-300 mb-2 uppercase tracking-widest text-black">
                  Core Competencies
                </h3>
                <p className="text-[11px] leading-[1.6] text-gray-800">
                  {stripMarkdown(formData.skills).split(",").map((s) => s.trim()).join(" • ")}
                </p>
              </div>
            )}

            {/* Education */}
            {formData.education && (
              <div className="mb-4">
                <h3 className="text-[12px] font-bold border-b border-gray-300 mb-2 uppercase tracking-widest text-black">
                  Education
                </h3>
                <div className="text-[11px] leading-[1.6] text-gray-800 whitespace-pre-wrap">
                  {stripMarkdown(formData.education)}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 右侧：ATS Analysis Panel */}
        <section className="w-[350px] border-l bg-white overflow-y-auto p-6 scrollbar-hide print:hidden">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-green-500" /> ATS Intelligence
          </h2>

          {/* ATS Match Score */}
          <div className="mb-8 p-5 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex justify-between items-end mb-3">
              <span className="text-xs font-semibold text-gray-500">Match Score</span>
              <span className="text-3xl font-black tracking-tighter"
                style={{ color: atsResult.score > 75 ? "#22c55e" : "#f59e0b" }}>
                {atsResult.score}%
              </span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div className="h-full transition-all duration-1000 ease-out"
                style={{
                  width: `${atsResult.score}%`,
                  backgroundColor: atsResult.score > 75 ? "#22c55e" : "#f59e0b",
                }}
              />
            </div>
            {atsResult.score === 0 && (
              <p className="text-[10px] text-gray-400 mt-2">Paste JD and optimize to get score.</p>
            )}
          </div>

          {/* Missing Keywords */}
          {atsResult.hasOptimized && atsResult.missingKeywords.length > 0 && (
            <div className="mb-6">
              <h3 className="text-[10px] font-bold text-gray-800 uppercase tracking-wider mb-3">Missing Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {atsResult.missingKeywords.map((keyword, i) => (
                  <span key={i} className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {atsResult.hasOptimized && atsResult.suggestions.length > 0 && (
            <div className="mb-8">
              <h3 className="text-[10px] font-bold text-gray-800 uppercase tracking-wider mb-3">Actionable Suggestions</h3>
              <ul className="list-disc pl-4 space-y-1">
                {atsResult.suggestions.map((item, i) => (
                  <li key={i} className="text-sm text-gray-600">{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recruiter Insight */}
          <div className="p-5 bg-slate-900 rounded-2xl text-white mt-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Recruiter Insight</h3>
            <p className="text-xs leading-relaxed text-slate-300">
              {atsResult.recruiterInsight || "Waiting for optimization..."}
            </p>
          </div>
        </section>

      </main>

      {/* 历史记录抽屉 */}
      {showHistory && (
        <div className="absolute inset-0 bg-black/20 z-50 flex justify-end print:hidden">
          <div className="w-[350px] bg-white h-full shadow-2xl animate-in slide-in-from-right flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-sm">Resume History</h3>
              <button onClick={() => setShowHistory(false)}
                className="p-1 hover:bg-gray-100 rounded-md text-gray-500">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2 flex-1">
              {history.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-10">No saved resumes yet.</p>
              ) : (
                history.map((item) => (
                  <div key={item.id}
                    className="group relative bg-gray-50 border border-gray-100 p-3 rounded-lg hover:border-black cursor-pointer transition-all"
                    onClick={() => {
                      const safeContent = typeof item.content === "string" ? item.content : "Content format error";
                      setFormData((prev) => ({ ...prev, experience: safeContent, title: item.position || item.name }));
                      setShowHistory(false);
                    }}
                  >
                    <p className="text-sm font-bold text-gray-900 truncate pr-6">{item.name}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{new Date(item.created_at).toLocaleDateString()}</p>
                    <button
                      onClick={(e) => deleteHistoryRecord(item.id, e)}
                      className="absolute right-2 top-2 p-1.5 bg-white text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity border border-red-100"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
