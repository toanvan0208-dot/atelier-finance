"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import type { AuthUser } from "@/lib/auth/session";

type LogoutButtonProps = {
  currentUser?: AuthUser | null;
};

const displayNameFrom = (user: AuthUser): string =>
  user.displayName?.trim() || user.email?.split("@")[0] || "Tài khoản";

export function LogoutButton({ currentUser }: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!currentUser) return null;

  async function handleLogout() {
    setIsLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    window.location.href = "/";
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="hidden max-w-36 truncate text-xs font-bold text-muted lg:inline">
        {displayNameFrom(currentUser)}
      </span>
      <Button
        isLoading={isLoggingOut}
        onClick={handleLogout}
        size="sm"
        variant="ghost"
      >
        Đăng xuất
      </Button>
    </div>
  );
}
