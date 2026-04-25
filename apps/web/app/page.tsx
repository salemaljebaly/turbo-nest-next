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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      "Postgres, Redis, RustFS, and MailHog preconfigured. One `docker compose up` and you're running.",
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

      <section className="relative flex min-h-screen flex-col overflow-hidden px-6 pt-24">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_24%,transparent_24%,var(--background)_78%)]" />

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-12 py-14">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <Badge variant="outline" className="mb-6 gap-2">
              <span className="inline-block size-1.5 rounded-full bg-primary" />
              Production-ready template
            </Badge>

            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
              Full-stack monorepo for products that need room to scale.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground text-balance">
              NestJS, Next.js, Better Auth, Drizzle, queues, typed API
              contracts, and deployment-ready Docker images in one reusable
              template.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/sign-up">
                  Get started
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a
                  href={`${API_URL}/docs`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  API docs
                  <ExternalLink data-icon="inline-end" />
                </a>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Card size="sm">
              <CardHeader>
                <CardTitle>API first</CardTitle>
                <CardDescription>
                  OpenAPI output and generated frontend types keep teams aligned
                  before runtime.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle>Stateless core</CardTitle>
                <CardDescription>
                  The API can scale horizontally, while queues stay optional for
                  bursty work.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle>Lean deploys</CardTitle>
                <CardDescription>
                  Production Docker images ship runtime artifacts, not the whole
                  workspace.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-y border-border/50 bg-muted/30 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <p className="mb-6 text-center text-xs font-medium uppercase text-muted-foreground">
            Built with
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {STACK.map((tech) => (
              <Badge key={tech} variant="outline">
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              A practical foundation.
              <br />
              <span className="font-normal text-muted-foreground">
                Small today, clean path to larger systems.
              </span>
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="transition-shadow hover:shadow-lg"
                >
                  <CardHeader>
                    <div className="mb-3 flex size-10 items-center justify-center rounded-4xl bg-muted text-foreground">
                      <Icon className="size-5" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <Card>
            <CardContent className="flex flex-col items-center gap-8 py-12 text-center">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight">
                  Start from a clean template.
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Clone, configure env, run infrastructure, and build.
                </p>
              </div>
              <code className="inline-flex border border-border bg-background px-4 py-2 font-mono text-sm text-foreground">
                pnpm install && pnpm dev
              </code>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild size="lg">
                  <Link href="/sign-up">
                    Create account
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a
                    href={`${API_URL}/health`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Health check
                    <ExternalLink data-icon="inline-end" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

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
