"use client";

import { Menu, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar({
  title = "turbo-nest-next",
  onOpenSettings,
}: {
  title?: string;
  onOpenSettings?: () => void;
}) {
  if (!onOpenSettings) {
    return (
      <header className="fixed top-0 right-0 left-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-7 items-center justify-center bg-primary text-xs text-primary-foreground">
              T
            </span>
            <span className="text-sm tracking-tight">{title}</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-up">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/90 px-4 backdrop-blur">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-4" />
        </Button>
        <h1 className="text-sm font-semibold">{title}</h1>
      </div>
      <Button variant="outline" size="sm" onClick={onOpenSettings}>
        <Settings className="size-3.5" />
        Settings
      </Button>
    </header>
  );
}
