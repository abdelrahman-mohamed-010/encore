import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthDivider, OAuthButtons } from "@/features/auth/components/oauth-buttons";
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
          New to Encore?{" "}
          <Link
            href={`/auth/register${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-medium text-ink transition-colors hover:text-ink-2"
          >
            Create an account
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="h-56 animate-pulse rounded-lg bg-sunken" />}>
        <LoginForm next={next} />
      </Suspense>
      <AuthDivider label="or continue with" />
      <OAuthButtons next={next} />
    </AuthCard>
  );
}
