"use client";

import * as React from "react";
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * A thin react-hook-form binding for the design system.
 *
 * `FormField` wires a control to its label, description, error text and the
 * aria-* attributes that connect them, so every form in the app reports errors
 * to assistive technology the same way without repeating the plumbing.
 */

export function Form<TIn extends FieldValues, TOut extends FieldValues = TIn>({
  form,
  onSubmit,
  className,
  children,
  ...props
}: {
  /**
   * Two type parameters, not one: TIn is what the inputs hold (all strings),
   * TOut is what the zod schema produces after its transforms. Collapsing them
   * makes handleSubmit hand you an untyped FieldValues.
   */
  form: UseFormReturn<TIn, unknown, TOut>;
  onSubmit: (values: TOut) => void | Promise<void>;
  className?: string;
  children: React.ReactNode;
} & Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit" | "children">) {
  return (
    <FormProvider {...form}>
      <form noValidate className={className} onSubmit={form.handleSubmit(onSubmit)} {...props}>
        {children}
      </form>
    </FormProvider>
  );
}

export function FormField<T extends FieldValues, N extends FieldPath<T>>({
  name,
  label,
  hint,
  required,
  className,
  children,
}: {
  name: N;
  label?: string;
  hint?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: (
    field: ControllerRenderProps<T, N> & { id: string; "aria-invalid": boolean },
  ) => React.ReactNode;
}) {
  const { control } = useFormContext<T>();
  const id = React.useId();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const describedBy = fieldState.error ? `${id}-error` : hint ? `${id}-hint` : undefined;

        return (
          <div className={cn("flex flex-col gap-1.5", className)}>
            {label && (
              <Label htmlFor={id} required={required}>
                {label}
              </Label>
            )}

            {children({
              ...field,
              id,
              "aria-invalid": Boolean(fieldState.error),
              ...({ "aria-describedby": describedBy } as object),
            } as ControllerRenderProps<T, N> & { id: string; "aria-invalid": boolean })}

            {fieldState.error ? (
              <p id={`${id}-error`} className="text-[12px] text-critical" role="alert">
                {fieldState.error.message}
              </p>
            ) : hint ? (
              <p id={`${id}-hint`} className="text-[12px] leading-relaxed text-ink-3">
                {hint}
              </p>
            ) : null}
          </div>
        );
      }}
    />
  );
}

/** Errors that belong to the submission as a whole, not one field. */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-transparent bg-critical-bg px-4 py-3 text-[13.5px] text-critical"
    >
      <AlertCircle className="mt-px size-4 shrink-0" />
      {message}
    </div>
  );
}
