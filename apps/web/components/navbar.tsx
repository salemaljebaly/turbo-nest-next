"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Zap, LogOut, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut, useSession } from "@/lib/auth/client"

export function Navbar() {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  async function handleSignOut() {
    await signOut({
      fetchOptions: {
        onSuccess: () => router.push("/"),
      },
    })
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-foreground transition-opacity hover:opacity-80"
        >
          <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Zap className="size-3.5" />
          </span>
          <span className="text-sm tracking-tight">turbo-nest-next</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isPending ? (
            <div className="h-8 w-32 animate-pulse rounded-lg bg-muted" />
          ) : session ? (
            <>
              <Button asChild variant="ghost" size="sm" className="gap-2">
                <Link href="/dashboard">
                  <LayoutDashboard className="size-3.5" />
                  Dashboard
                </Link>
              </Button>
              <div className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {session.user.name?.charAt(0).toUpperCase() ?? "U"}
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleSignOut}
                title="Sign out"
              >
                <LogOut className="size-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/sign-in">
                  Sign in
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/sign-up">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
