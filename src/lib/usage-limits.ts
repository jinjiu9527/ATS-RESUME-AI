/**
 * 本地用量追踪（未登录用户使用 localStorage）
 * 登录用户使用数据库记录（见 userActions.ts）
 */

const STORAGE_KEY = "ats_usage";
const FREE_DAILY_LIMIT = 3;

interface LocalUsage {
  date: string; // YYYY-MM-DD
  count: number;
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getStoredUsage(): LocalUsage {
  if (typeof window === "undefined") return { date: "", count: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: "", count: 0 };
    return JSON.parse(raw);
  } catch {
    return { date: "", count: 0 };
  }
}

function setStoredUsage(usage: LocalUsage): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
}

/** 检查本地是否还有剩余次数 */
export function checkLocalUsage(): boolean {
  const today = getToday();
  const usage = getStoredUsage();
  if (usage.date !== today) return true;
  return usage.count < FREE_DAILY_LIMIT;
}

/** 增加本地使用次数 */
export function incrementLocalUsage(): void {
  const today = getToday();
  const usage = getStoredUsage();
  if (usage.date !== today) {
    setStoredUsage({ date: today, count: 1 });
  } else {
    setStoredUsage({ date: today, count: usage.count + 1 });
  }
}

/** 获取剩余本地次数 */
export function getLocalRemainingUsage(): number {
  const today = getToday();
  const usage = getStoredUsage();
  if (usage.date !== today) return FREE_DAILY_LIMIT;
  return Math.max(0, FREE_DAILY_LIMIT - usage.count);
}

/** 获取每日总限制 */
export function getLocalDailyLimit(): number {
  return FREE_DAILY_LIMIT;
}
