"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { signUp } from "@/lib/auth/client"

type SignUpFormProps = {
  callbackURL: string
}

export function SignUpForm({ callbackURL }: SignUpFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await signUp.email({
      name,
      email,
      password,
      callbackURL,
    })

    if (result?.error) {
      setError(result.error.message ?? "Could not create account. Please try again.")
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-md">
        <Card className="border border-border/60 py-0 shadow-lg shadow-black/5">
          <CardContent className="flex flex-col items-center gap-4 px-8 pt-10 pb-10 text-center sm:px-10">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="size-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Check your email</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                We sent a verification link to{" "}
                <span className="font-medium text-foreground">{email}</span>.
                Click it to activate your account.
              </p>
            </div>
            <Link href="/sign-in" className="text-sm font-medium underline-offset-4 hover:underline">
              Back to sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Start building with the full stack
        </p>
      </div>

      <Card className="border border-border/60 py-0 shadow-lg shadow-black/5">
        <form onSubmit={handleSubmit} className="contents">
          <CardHeader className="px-8 pt-8 pb-0 sm:px-10">
            <CardTitle className="text-base">Sign up</CardTitle>
            <CardDescription>Fill in your details to get started</CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4 px-8 sm:px-10">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 12 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={12}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 12 characters.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex-col gap-3 border-t border-border/60 px-8 pt-6 pb-8 sm:px-10">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loading ? "Creating account…" : "Create account"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
