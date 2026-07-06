"use client";

import { LogOut, Settings, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NavUser({
  user,
  onSignOut,
  onOpenSettings,
}: {
  user: {
    name: string;
    email: string;
  };
  onSignOut: () => void;
  onOpenSettings: (tab: "general" | "account") => void;
}) {
  const fallback = (user.name || user.email || "U").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-2 border-t pt-3">
      <div className="flex items-center gap-2 px-1">
        <div className="flex size-8 items-center justify-center border bg-muted text-xs font-medium">
          {fallback}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{user.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {user.email}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenSettings("account")}
        >
          <UserCircle className="size-3.5" />
          Account
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenSettings("general")}
        >
          <Settings className="size-3.5" />
          Settings
        </Button>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start"
        onClick={onSignOut}
      >
        <LogOut className="size-3.5" />
        Sign out
      </Button>
    </div>
  );
}
