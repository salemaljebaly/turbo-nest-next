import type { Metadata } from "next";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = {
  title: "Sign Up",
};

type SignUpPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string;
    redirect?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const resolvedSearchParams = await searchParams;
  const callbackURL =
    resolvedSearchParams?.callbackUrl ??
    resolvedSearchParams?.redirect ??
    "/dashboard";

  return <SignUpForm callbackURL={callbackURL} />;
}
