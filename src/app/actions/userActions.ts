'use server'

import { auth } from '@clerk/nextjs/server'
import { createClerkSupabaseClient } from '@/lib/supabase'

export async function checkAndIncrementUsage(type: 'resume' | 'pdf') {
  const { userId, getToken } = await auth()
  if (!userId) throw new Error("Login required")

  const today = new Date().toISOString().split('T')[0]

  const token = await getToken({ template: 'supabase' })
  const supabase = createClerkSupabaseClient(token)

  // 1. 获取当前用户的限制数据
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  // 2. 如果用户是第一次使用，创建记录
  if (!profile) {
    console.log("当前 userId:", userId)
    const { data: newProfile, error: createError } = await supabase
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

  // 3. 检查日期：如果是新的一天，重置本地变量
  let {
    resume_generations = 0,
    pdf_downloads = 0,
    last_reset_date = today
  } = profile || {}

  if (last_reset_date !== today) {
    resume_generations = 0
    pdf_downloads = 0
    last_reset_date = today
  }

  // 4. 校验限制：生成 3 次，PDF 1 次
  if (type === 'resume' && resume_generations >= 3) {
    throw new Error("Daily free limit reached (3/3). Try again tomorrow")
  }
  if (type === 'pdf' && pdf_downloads >= 1) {
    throw new Error("Daily PDF export limit reached (1/1). Try again tomorrow")
  }

  // 5. 更新数据库：次数 +1
  const updateData = {
    resume_generations: type === 'resume' ? resume_generations + 1 : resume_generations,
    pdf_downloads: type === 'pdf' ? pdf_downloads + 1 : pdf_downloads,
    last_reset_date: today
  }

  const { error: updateError } = await supabase
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

  const today = new Date().toISOString().split('T')[0]
  const token = await getToken({ template: 'supabase' })
  const supabase = createClerkSupabaseClient(token)

  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (!profile) {
    const { data: newProfile, error: createError } = await supabase
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

  if (type === 'resume' && resume_generations >= 3) {
    throw new Error("今日免费生成次数（3次）已用完，请明天再试")
  }
  if (type === 'pdf' && pdf_downloads >= 1) {
    throw new Error("今日免费导出 PDF 次数（1次）已用完，请明天再试")
  }

  return true
}

// 仅扣除次数，不验证
export async function decrementUsage(type: 'resume' | 'pdf') {
  const { userId, getToken } = await auth()
  if (!userId) return

  const today = new Date().toISOString().split('T')[0]
  const token = await getToken({ template: 'supabase' })
  const supabase = createClerkSupabaseClient(token)

  let { data: profile } = await supabase
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

  await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId)
}