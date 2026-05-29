-- ============================================
-- ResumeAI - Supabase 数据库迁移
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================

-- 1. 为 profiles 表添加订阅相关列
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS lemon_squeezy_customer_id TEXT,
ADD COLUMN IF NOT EXISTS lemon_squeezy_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS lemon_squeezy_order_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT,
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;

-- 2. 为已有用户设置默认值
UPDATE profiles SET plan = 'free' WHERE plan IS NULL;

-- 3. 创建索引加速查询
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_lemon_squeezy_customer_id ON profiles(lemon_squeezy_customer_id);
