import { SignInForm } from "./sign-in-form"

type SignInPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string
    redirect?: string
  }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const resolvedSearchParams = await searchParams
  const callbackURL =
    resolvedSearchParams?.callbackUrl ??
    resolvedSearchParams?.redirect ??
    "/dashboard"

  return <SignInForm callbackURL={callbackURL} />
}
