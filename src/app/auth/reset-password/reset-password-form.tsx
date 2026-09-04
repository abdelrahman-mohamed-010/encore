"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAsyncAction } from "@/hooks";
import { resetPasswordSchema, type ResetPasswordData, type ResetPasswordValues } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Form, FormError, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function ResetPasswordForm() {
  const router = useRouter();
  const [linkVerified, setLinkVerified] = useState(false);

  const form = useForm<ResetPasswordValues, unknown, ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });

  // Supabase delivers the recovery session in the URL fragment; wait for the
  // client to pick it up before allowing a submission.
  useEffect(() => {
    const supabase = createClient();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setLinkVerified(true);
    });
    supabase.auth.getSession().then(({ data: session }) => {
      if (session.session) setLinkVerified(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const update = useAsyncAction(async ({ password }: ResetPasswordData) => {
    const { error } = await createClient().auth.updateUser({ password });
    if (error) throw new Error(error.message);

    toast.success("Password updated");
    router.push("/account/tickets");
    router.refresh();
  });

  return (
    <Form form={form} onSubmit={update.run} className="space-y-4">
      <FormField<ResetPasswordValues, "password"> name="password" label="New password" required>
        {(field) => <Input {...field} type="password" autoComplete="new-password" />}
      </FormField>

      <FormField<ResetPasswordValues, "confirm"> name="confirm" label="Confirm password" required>
        {(field) => <Input {...field} type="password" autoComplete="new-password" />}
      </FormField>

      <FormError message={update.error} />

      <Button
        type="submit"
        variant="solid"
        size="lg"
        block
        loading={form.formState.isSubmitting}
        disabled={!linkVerified}
      >
        {linkVerified ? "Update password" : "Verifying link…"}
      </Button>
    </Form>
  );
}
