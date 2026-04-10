"use client"

import Link from "next/link"
import { startTransition, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { organization, useSession } from "@/lib/auth/client"

export default function AcceptInvitationPage() {
  const params = useParams<{ invitationId: string }>()
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [error, setError] = useState<string | null>(null)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    if (isPending) return

    if (!session) {
      router.replace(`/sign-in?redirect=/accept-invitation/${params.invitationId}`)
      return
    }

    startTransition(async () => {
      const result = await organization.acceptInvitation({
        invitationId: params.invitationId,
      })

      if (result?.error) {
        setError(result.error.message ?? "Could not accept invitation.")
        return
      }

      setAccepted(true)
      setTimeout(() => {
        router.replace("/dashboard")
      }, 1200)
    })
  }, [isPending, params.invitationId, router, session])

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center px-6 py-16">
      <Card className="w-full border border-border/60 py-0 shadow-lg shadow-black/5">
        <CardHeader className="px-8 pt-8 pb-0 sm:px-10">
          <CardTitle>Organization invitation</CardTitle>
          <CardDescription>
            Accept the invitation and continue into your workspace.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 py-8 sm:px-10">
          {isPending && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Checking your session…
            </div>
          )}

          {!isPending && accepted && (
            <div className="flex items-start gap-3 rounded-3xl border border-border/60 bg-secondary/50 p-4 text-sm">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="font-medium">Invitation accepted.</p>
                <p className="text-muted-foreground">
                  Redirecting you to the dashboard now.
                </p>
              </div>
            </div>
          )}

          {!isPending && error && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-3xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="font-medium">Invitation could not be accepted.</p>
                  <p>{error}</p>
                </div>
              </div>

              <Button asChild variant="outline">
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
