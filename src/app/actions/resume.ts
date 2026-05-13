"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { checkAndIncrementUsage } from './userActions';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type Resume = {
  id?: string | number;
  user_id: string;
  name: string;
  position: string;
  content: string;
  created_at?: string;
};

// 保存
export async function saveResume(resume: Resume) {
  // --- 新增：次数校验 ---
  await checkAndIncrementUsage('resume'); 
  // --------------------
  try {
    const { data, error } = await supabase
      .from("resumes")
      .insert([{
        user_id: String(resume.user_id),
        name: String(resume.name),
        position: String(resume.position),
        content: String(resume.content),
      }])
      .select().single();

    if (error) throw new Error(error.message);

    // 哪怕环境变量对了，这里的 try-catch 也要留着，防止 Windows 路径干扰
    try {
      revalidatePath("/resume", "page");
    } catch (e) {}

    return data;
  } catch (err: any) {
    console.error("❌ 保存失败:", err.message);
    throw err;
  }
}

// 获取
export async function getResumes(userId: string) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", String(userId))
    .order("created_at", { ascending: false });

  return error ? [] : (data as Resume[]);
}

// 删除
export async function deleteResume(id: string | number) {
  try {
    const { error } = await supabase
      .from("resumes")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
    
    try {
      revalidatePath("/resume", "page");
    } catch (e) {}
    
    return { success: true };
  } catch (err: any) {
    throw err;
  }
}