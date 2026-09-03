import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthDivider, OAuthButtons } from "@/components/auth/oauth-buttons";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to see your tickets and manage your events."
      footer={
        <>
          New to Tazkarti?{" "}
          <Link
            href={`/auth/register${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-medium text-ink underline underline-offset-4"
          >
            Create an account
          </Link>
        </>
      }
    >
      <OAuthButtons next={next} />
      <AuthDivider label="or continue with email" />
      <Suspense fallback={<div className="h-56 animate-pulse rounded-lg bg-sunken" />}>
        <LoginForm next={next} />
      </Suspense>
    </AuthCard>
  );
}
