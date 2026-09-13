import Link from "next/link";
import type { Metadata } from "next";
import { AuthCard } from "@/features/auth/components/auth-card";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      description="We will email you a link to choose a new one."
      footer={
        <Link href="/auth/login" className="font-medium text-ink transition-colors hover:text-ink-2">
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
