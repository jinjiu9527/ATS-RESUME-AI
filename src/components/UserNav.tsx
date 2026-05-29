"use client";

import { UserButton, useUser, SignInButton } from "@clerk/nextjs";

export function UserNav() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return <div className="h-10" />;

  return (
    <div className="flex items-center gap-3 p-4 border-t border-slate-200">
      {user ? (
        <div className="flex items-center gap-2">
          <UserButton />
          <div className="flex flex-col overflow-hidden">
            <p className="text-xs font-bold text-slate-800 truncate">
              {user?.fullName || "User"}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>
      ) : (
        <SignInButton mode="modal">
          <button className="w-full py-2 bg-black text-white text-[11px]">
            Sign In to Get Started
          </button>
        </SignInButton>
      )}
    </div>
  );
}