'use server'

import { auth } from '@clerk/nextjs/server'
import { createClerkSupabaseClient, supabase } from '@/lib/supabase'

// Daily limits for free users
const FREE_LIMITS = {
  resume: 3,
  pdf: 1,
} as const

/** Check if user has an active Pro subscription */
async function isUserPro(userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, subscription_status')
    .eq('id', userId)
    .single()

  if (!profile) return false
  // Pro plan with active or cancelled (still within billing period) status
  return profile.plan === 'pro' &&
    (profile.subscription_status === 'active' ||
     profile.subscription_status === 'cancelled')
}

export async function checkAndIncrementUsage(type: 'resume' | 'pdf') {
  const { userId, getToken } = await auth()
  if (!userId) throw new Error("Login required")

  // Pro users bypass all limits
  const pro = await isUserPro(userId)
  if (pro) {
    // Track usage for analytics but don't block
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
    return
  }

  const today = new Date().toISOString().split('T')[0]
  const token = await getToken({ template: 'supabase' })
  const supabaseClient = createClerkSupabaseClient(token)

  // Get or create profile
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
      throw new Error("Failed to initialize user profile")
    }
    profile = newProfile
  }

  let {
    resume_generations = 0,
    pdf_downloads = 0,
    last_reset_date = today
  } = profile || {}

  // Reset counters for a new day
  if (last_reset_date !== today) {
    resume_generations = 0
    pdf_downloads = 0
    last_reset_date = today
  }

  // Check free user limits
  const limit = FREE_LIMITS[type]
  const current = type === 'resume' ? resume_generations : pdf_downloads
  const label = type === 'resume' ? 'ATS scan' : 'PDF export'

  if (current >= limit) {
    throw new Error(`Daily free ${label} limit reached (${current}/${limit}). Upgrade to Pro or try again tomorrow.`)
  }

  // Increment usage
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
    throw new Error("Failed to update usage count")
  }
}

// Verify usage without deducting
export async function verifyUsage(type: 'resume' | 'pdf') {
  const { userId, getToken } = await auth()
  if (!userId) throw new Error("Login required")

  // Pro users have no limits
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
      throw new Error("Failed to initialize user profile")
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
  const label = type === 'resume' ? 'ATS scan' : 'PDF export'

  if (current >= limit) {
    throw new Error(`Daily free ${label} limit reached (${current}/${limit}). Upgrade to Pro or try again tomorrow.`)
  }

  return true
}

// Deduct usage without validating
export async function decrementUsage(type: 'resume' | 'pdf') {
  const { userId, getToken } = await auth()
  if (!userId) return

  // Pro users don't get deducted
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
