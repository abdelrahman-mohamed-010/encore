"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import {
  createCategory,
  deleteCategory,
  setCategoryActive,
} from "@/features/admin/actions";
import { useAsyncAction } from "@/hooks";
import { categorySchema, type CategoryData, type CategoryValues } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Card } from "@/components/ui/surface";
import { Input, Switch } from "@/components/ui/input";
import { ColorPicker } from "@/components/ui/color-picker";
import { Form, FormError, FormField } from "@/components/ui/form";
import type { Category } from "@/lib/types";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const form = useForm<CategoryValues, unknown, CategoryData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", color: "#2a78d6" },
  });

  const toggle = useAction(setCategoryActive, {
    onError: ({ error }) => toast.error("Could not update", { description: error.serverError }),
  });

  const remove = useAction(deleteCategory, {
    onSuccess: () => toast.success("Category deleted"),
    onError: ({ error }) => toast.error("Could not delete", { description: error.serverError }),
  });

  const add = useAsyncAction(async (values: CategoryData) => {
    const result = await createCategory({ ...values, sortOrder: categories.length + 1 });
    if (result?.serverError) throw new Error(result.serverError);

    toast.success("Category added");
    form.reset({ name: "", color: values.color });
  });

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-center gap-3 border-b border-hairline-soft px-4 py-3 last:border-b-0"
          >
            <span
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: category.color }}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-medium text-ink">{category.name}</p>
              <p className="truncate text-xs text-ink-3">/{category.slug}</p>
            </div>
            <Switch
              checked={category.is_active}
              onCheckedChange={(next) => toggle.execute({ id: category.id, isActive: next })}
              label={`Toggle ${category.name}`}
            />
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="icon-sm" aria-label={`Delete ${category.name}`}>
                  <Trash2 />
                </Button>
              }
              title={`Delete ${category.name}?`}
              description="This can't be undone. If events still reference this category the delete will fail — deactivate it instead."
              confirmLabel="Delete category"
              onConfirm={async () => {
                await remove.executeAsync({ id: category.id });
              }}
            />
          </div>
        ))}
      </Card>

      <Card>
        <Form form={form} onSubmit={add.run} className="space-y-3 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <FormField<CategoryValues, "name">
              name="name"
              label="New category"
              className="min-w-48 flex-1"
            >
              {(field) => <Input {...field} placeholder="Workshops" />}
            </FormField>

            <FormField<CategoryValues, "color"> name="color" label="Colour">
              {({ value, onChange, onBlur, ...field }) => (
                <ColorPicker
                  {...field}
                  value={value ?? "#7c5cff"}
                  onChange={onChange}
                  onBlur={onBlur}
                />
              )}
            </FormField>

            <Button type="submit" variant="solid" loading={form.formState.isSubmitting}>
              <Plus /> Add
            </Button>
          </div>

          <FormError message={add.error} />
        </Form>
      </Card>
    </div>
  );
}
