import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Code2,
  Database,
  Layers,
  Container,
  BookOpen,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Ship your next project with NestJS, Next.js, Better Auth, and Drizzle — everything wired together so you can focus on your product.",
};

const STACK = [
  "Turborepo 2",
  "NestJS 11",
  "Next.js 16",
  "TypeScript 6",
  "Better Auth",
  "Drizzle ORM",
  "PostgreSQL",
  "Redis",
  "Tailwind v4",
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Auth Ready",
    description:
      "Better Auth with email/password, organizations, sessions, and rate-limiting — wired up out of the box.",
  },
  {
    icon: Code2,
    title: "Fully Type-Safe",
    description:
      "TypeScript 6 end-to-end. Shared types between frontend and backend via workspace packages.",
  },
  {
    icon: Database,
    title: "Database & Migrations",
    description:
      "Drizzle ORM with PostgreSQL. Run `pnpm db:generate` and `pnpm db:migrate` from the root.",
  },
  {
    icon: Layers,
    title: "Monorepo Architecture",
    description:
      "Turborepo + pnpm workspaces. Shared config, UI, and types packages. One command to run everything.",
  },
  {
    icon: Container,
    title: "Docker Compose",
    description:
      "Postgres, Redis, MinIO, and MailHog preconfigured. One `docker compose up` and you're running.",
  },
  {
    icon: BookOpen,
    title: "API Documentation",
    description:
      "Swagger UI auto-generated from your NestJS controllers. Always up-to-date, zero configuration.",
  },
];

const API_URL =
  process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001/api";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-14">
        {/* Subtle grid background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
        {/* Radial fade over grid */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,transparent_40%,var(--background)_100%)]" />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <div className="mb-6 flex justify-center">
            <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs">
              <span className="size-1.5 rounded-full bg-primary animate-pulse inline-block" />
              Production-ready template
            </Badge>
          </div>

          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-b from-foreground to-foreground/50 bg-clip-text text-transparent">
              Production-ready
              <br />
              full-stack monorepo
            </span>
          </h1>

          <p className="mb-10 max-w-xl mx-auto text-lg text-muted-foreground leading-relaxed">
            Ship your next project with NestJS, Next.js, Better Auth, and
            Drizzle — everything wired together so you can focus on your
            product.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
              Get started
              <ArrowRight className="size-4" />
            </Link>
            <a
              href={`${API_URL}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              API docs
              <ExternalLink className="size-4" />
            </a>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-muted-foreground/50">
          <div className="h-6 w-px bg-gradient-to-b from-transparent to-muted-foreground/30" />
        </div>
      </section>

      {/* Tech stack */}
      <section className="border-y border-border/50 bg-muted/30 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <p className="mb-6 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Built with
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {STACK.map((tech) => (
              <Badge key={tech} variant="outline" className="text-xs">
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need.
              <br />
              <span className="text-muted-foreground font-normal">
                Nothing you don&apos;t.
              </span>
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-border/60 bg-card p-6 transition-all duration-200 hover:border-border hover:shadow-sm"
                >
                  <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mb-2 font-semibold">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-12 text-center">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_100%,var(--primary)/0.06,transparent)]" />
            <h2 className="mb-3 text-3xl font-bold tracking-tight">
              Start building today
            </h2>
            <p className="mb-8 text-muted-foreground">
              Clone, install, and run — in under two minutes.
            </p>
            <div className="mb-8 inline-flex items-center rounded-xl border border-border bg-muted/50 px-5 py-2.5 font-mono text-sm text-foreground/70">
              pnpm install && pnpm dev
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
                Create account
                <ArrowRight className="size-4" />
              </Link>
              <a
                href={`${API_URL}/health`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                Health check
                <ExternalLink className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              turbo-nest-next
            </span>
            <span>·</span>
            <span>MIT License</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <a
              href={`${API_URL}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              API Docs
            </a>
            <a
              href={`${API_URL}/health`}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              Health
            </a>
            <Link
              href="/sign-in"
              className="transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
