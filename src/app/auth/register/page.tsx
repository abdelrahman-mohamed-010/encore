import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthDivider, OAuthButtons } from "@/features/auth/components/oauth-buttons";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create an account" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <AuthCard
      title="Create your account"
      description="Book tickets in seconds and start selling your own events."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={`/auth/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-medium text-ink underline underline-offset-4"
          >
            Sign in
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="h-72 animate-pulse rounded-lg bg-sunken" />}>
        <RegisterForm next={next} />
      </Suspense>
      <AuthDivider label="or sign up with" />
      <OAuthButtons next={next} />
    </AuthCard>
  );
}
