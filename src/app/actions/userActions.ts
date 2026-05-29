'use server'

import { auth } from '@clerk/nextjs/server'
import { createClerkSupabaseClient, supabase } from '@/lib/supabase'

// 免费用户每日限制
const FREE_LIMITS = {
  resume: 3,
  pdf: 1,
} as const

/** 检查用户是否为 Pro */
async function isUserPro(userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, subscription_status')
    .eq('id', userId)
    .single()

  if (!profile) return false
  // Pro 且状态为 active（取消但未到期也算 active）
  return profile.plan === 'pro' &&
    (profile.subscription_status === 'active' ||
     profile.subscription_status === 'cancelled')
}

export async function checkAndIncrementUsage(type: 'resume' | 'pdf') {
  const { userId, getToken } = await auth()
  if (!userId) throw new Error("Login required")

  // 检查是否为 Pro 用户，Pro 用户无限制
  const pro = await isUserPro(userId)
  if (pro) {
    // Pro 用户仅记录使用，不限制
    const today = new Date().toISOString().split('T')[0]
    const token = await getToken({ template: 'supabase' })
    const client = createClerkSupabaseClient(token)
    const { data: profile } = await client
      .from('profiles')
      .select('resume_generations, pdf_downloads, last_reset_date')
      .eq('id', userId)
      .single()

    const resumeCount = (profile?.last_reset_date === today ? (profile?.resume_generations || 0) : 0)
    const pdfCount = (profile?.last_reset_date === today ? (profile?.pdf_downloads || 0) : 0)
    await client
      .from('profiles')
      .upsert({
        id: userId,
        resume_generations: type === 'resume' ? resumeCount + 1 : resumeCount,
        pdf_downloads: type === 'pdf' ? pdfCount + 1 : pdfCount,
        last_reset_date: today
      }, { onConflict: 'id' })
    return // Pro 用户无限制，直接通过
  }

  const today = new Date().toISOString().split('T')[0]
  const token = await getToken({ template: 'supabase' })
  const supabaseClient = createClerkSupabaseClient(token)

  // 获取或创建用户记录
  let { data: profile } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (!profile) {
    const { data: newProfile, error: createError } = await supabaseClient
      .from('profiles')
      .insert([{ id: userId, resume_generations: 0, pdf_downloads: 0, last_reset_date: today }])
      .select()
      .single()

    if (createError) {
      console.error("createError:", JSON.stringify(createError))
      throw new Error("初始化用户配置失败")
    }
    profile = newProfile
  }

  let {
    resume_generations = 0,
    pdf_downloads = 0,
    last_reset_date = today
  } = profile || {}

  // 新的一天重置计数
  if (last_reset_date !== today) {
    resume_generations = 0
    pdf_downloads = 0
    last_reset_date = today
  }

  // 检查免费用户限制
  const limit = FREE_LIMITS[type]
  const current = type === 'resume' ? resume_generations : pdf_downloads
  const label = type === 'resume' ? 'ATS 检测' : 'PDF 导出'

  if (current >= limit) {
    throw new Error(`每日免费${label}次数已用完 (${current}/${limit})。请升级 Pro 会员或明天再试。`)
  }

  // 更新次数
  const updateData = {
    resume_generations: type === 'resume' ? resume_generations + 1 : resume_generations,
    pdf_downloads: type === 'pdf' ? pdf_downloads + 1 : pdf_downloads,
    last_reset_date: today
  }

  const { error: updateError } = await supabaseClient
    .from('profiles')
    .update(updateData)
    .eq('id', userId)

  if (updateError) {
    console.error("updateError:", JSON.stringify(updateError))
    throw new Error("更新使用次数失败")
  }
}

// 仅验证次数，不扣除
export async function verifyUsage(type: 'resume' | 'pdf') {
  const { userId, getToken } = await auth()
  if (!userId) throw new Error("请先登录")

  // Pro 用户无限制
  const pro = await isUserPro(userId)
  if (pro) return true

  const today = new Date().toISOString().split('T')[0]
  const token = await getToken({ template: 'supabase' })
  const supabaseClient = createClerkSupabaseClient(token)

  let { data: profile } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (!profile) {
    const { data: newProfile, error: createError } = await supabaseClient
      .from('profiles')
      .insert([{ id: userId, resume_generations: 0, pdf_downloads: 0, last_reset_date: today }])
      .select()
      .single()

    if (createError) {
      console.error("createError:", JSON.stringify(createError))
      throw new Error("无法初始化用户配置")
    }
    profile = newProfile
  }

  let {
    resume_generations = 0,
    pdf_downloads = 0,
    last_reset_date = today
  } = profile || {}

  if (last_reset_date !== today) {
    resume_generations = 0
    pdf_downloads = 0
  }

  const limit = FREE_LIMITS[type]
  const current = type === 'resume' ? resume_generations : pdf_downloads
  const label = type === 'resume' ? 'ATS 检测' : 'PDF 导出'

  if (current >= limit) {
    throw new Error(`每日免费${label}次数已用完 (${current}/${limit})。请升级 Pro 会员或明天再试。`)
  }

  return true
}

// 仅扣除次数，不验证
export async function decrementUsage(type: 'resume' | 'pdf') {
  const { userId, getToken } = await auth()
  if (!userId) return

  // Pro 用户不扣除
  const pro = await isUserPro(userId)
  if (pro) return

  const today = new Date().toISOString().split('T')[0]
  const token = await getToken({ template: 'supabase' })
  const supabaseClient = createClerkSupabaseClient(token)

  let { data: profile } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (!profile) return

  let {
    resume_generations = 0,
    pdf_downloads = 0,
    last_reset_date = today
  } = profile || {}

  if (last_reset_date !== today) {
    resume_generations = 0
    pdf_downloads = 0
  }

  const updateData = {
    resume_generations: type === 'resume' ? resume_generations + 1 : resume_generations,
    pdf_downloads: type === 'pdf' ? pdf_downloads + 1 : pdf_downloads,
    last_reset_date: today
  }

  await supabaseClient
    .from('profiles')
    .update(updateData)
    .eq('id', userId)
}
