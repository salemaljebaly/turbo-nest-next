"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  LogOut,
  BookOpen,
  HeartPulse,
  Zap,
  User,
  ExternalLink,
  Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { signOut, useSession } from "@/lib/auth/client"

const QUICK_LINKS = [
  {
    icon: BookOpen,
    title: "API Documentation",
    description: "Browse all available endpoints with Swagger UI.",
    href: "http://localhost:3001/api/docs",
    external: true,
    badge: "Swagger",
  },
  {
    icon: HeartPulse,
    title: "Health Check",
    description: "Verify database and Redis connectivity in real time.",
    href: "http://localhost:3001/api/health",
    external: true,
    badge: "JSON",
  },
  {
    icon: Layers,
    title: "API Root",
    description: "The base endpoint of the NestJS REST API.",
    href: "http://localhost:3001/api",
    external: true,
    badge: "REST",
  },
]

export default function DashboardPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/sign-in")
    }
  }, [session, isPending, router])

  async function handleSignOut() {
    await signOut({
      fetchOptions: {
        onSuccess: () => router.push("/"),
      },
    })
  }

  // Loading skeleton
  if (isPending) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav skeleton />
        <main className="mx-auto max-w-5xl px-6 py-10">
          <div className="mb-8 space-y-2">
            <div className="h-7 w-64 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-40 animate-pulse rounded-lg bg-muted" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-40 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        </main>
      </div>
    )
  }

  if (!session) return null

  const { user } = session
  const initials = user.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "U"

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav onSignOut={handleSignOut} />

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user.name?.split(" ")[0] ?? "there"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s running in your stack.
          </p>
        </div>

        {/* User card */}
        <Card className="mb-8">
          <CardContent className="flex items-center gap-5 pt-6 pb-6">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold truncate">{user.name}</p>
                {user.emailVerified && (
                  <Badge variant="secondary" className="text-xs">Verified</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="shrink-0 gap-2"
            >
              <LogOut className="size-3.5" />
              Sign out
            </Button>
          </CardContent>
        </Card>

        {/* Quick links */}
        <div className="mb-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Quick access
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {QUICK_LINKS.map((item) => {
            const Icon = item.icon
            return (
              <a
                key={item.href}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                className="group block"
              >
                <Card className="h-full transition-all duration-150 hover:border-border hover:shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                        <Icon className="size-4.5" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-xs">
                          {item.badge}
                        </Badge>
                        {item.external && (
                          <ExternalLink className="size-3 text-muted-foreground/50" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="mb-1 text-base">{item.title}</CardTitle>
                    <CardDescription className="text-xs leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </a>
            )
          })}
        </div>

        {/* Info footer */}
        <Separator className="mt-12 mb-6" />
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Zap className="size-3.5" />
            <span>turbo-nest-next</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <a
              href="http://localhost:3001/api/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              API Docs
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}

function DashboardNav({
  onSignOut,
  skeleton,
}: {
  onSignOut?: () => void
  skeleton?: boolean
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-foreground transition-opacity hover:opacity-80"
        >
          <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Zap className="size-3.5" />
          </span>
          <span className="text-sm tracking-tight">turbo-nest-next</span>
        </Link>

        <div className="flex items-center gap-2">
          {skeleton ? (
            <div className="h-8 w-24 animate-pulse rounded-lg bg-muted" />
          ) : (
            <>
              <Badge variant="secondary" className="gap-1.5 text-xs">
                <User className="size-3" />
                Dashboard
              </Badge>
              {onSignOut && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onSignOut}
                  title="Sign out"
                >
                  <LogOut className="size-3.5" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}
