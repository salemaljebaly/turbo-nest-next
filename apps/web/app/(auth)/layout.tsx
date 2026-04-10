import Link from "next/link"
import { Zap } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Minimal auth header */}
      <header className="flex h-14 items-center border-b border-border/50 px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-foreground transition-opacity hover:opacity-80"
        >
          <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Zap className="size-3.5" />
          </span>
          <span className="text-sm tracking-tight">turbo-nest-next</span>
        </Link>
      </header>

      {/* Centered content */}
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        {children}
      </main>

      <footer className="flex h-12 items-center justify-center border-t border-border/50 px-6">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} turbo-nest-next. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
