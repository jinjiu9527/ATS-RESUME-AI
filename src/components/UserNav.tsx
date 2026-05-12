"use client";

import { 
  UserButton, 
  useUser, 
  SignedIn, 
  SignedOut, 
  SignInButton 
} from "@clerk/nextjs";

export function UserNav() {
  const { user, isLoaded } = useUser();

  // 如果 Clerk 还没加载完，返回 null 或一个简单的加载占位，防止界面闪烁
  if (!isLoaded) return <div className="h-10" />;

  return (
    <div className="flex items-center gap-3 p-4 border-t border-slate-100 mt-auto no-print text-left">
      {/* 已登录状态 */}
      <SignedIn>
        <div className="flex items-center gap-2">
          {/* 最新版 UserButton 默认就会处理退出后的跳转，通常不需要传 afterSignOutUrl */}
          <UserButton />
          <div className="flex flex-col overflow-hidden">
            <p className="text-xs font-bold text-slate-800 truncate">
              {user?.fullName || "用户"}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>
      </SignedIn>
      
      {/* 未登录状态 */}
      <SignedOut>
        <SignInButton mode="modal">
          <button className="w-full py-2 bg-black text-white text-[11px] font-bold rounded-lg uppercase tracking-widest hover:bg-slate-800 transition-all">
            登录开始使用
          </button>
        </SignInButton>
      </SignedOut>
    </div>
  );
}