import { SignUpForm } from "./sign-up-form"

type SignUpPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string
    redirect?: string
  }>
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const resolvedSearchParams = await searchParams
  const callbackURL =
    resolvedSearchParams?.callbackUrl ??
    resolvedSearchParams?.redirect ??
    "/dashboard"

  return <SignUpForm callbackURL={callbackURL} />
}
