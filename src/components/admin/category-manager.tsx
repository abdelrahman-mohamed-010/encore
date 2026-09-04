"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAsyncAction } from "@/hooks";
import {
  categorySchema,
  slugify,
  type CategoryData,
  type CategoryValues,
} from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/surface";
import { Input, Switch } from "@/components/ui/input";
import { ColorPicker } from "@/components/ui/color-picker";
import { Form, FormError, FormField } from "@/components/ui/form";
import type { Category } from "@/lib/types";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const form = useForm<CategoryValues, unknown, CategoryData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", color: "#2a78d6" },
  });

  const add = useAsyncAction(async (values: CategoryData) => {
    const { error } = await createClient().from("categories").insert({
      name: values.name,
      slug: slugify(values.name),
      color: values.color,
      sort_order: categories.length + 1,
    });

    if (error) {
      throw new Error(
        error.code === "23505" ? "That category already exists." : error.message,
      );
    }

    toast.success("Category added");
    form.reset({ name: "", color: values.color });
    router.refresh();
  });

  function toggle(category: Category) {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("categories")
        .update({ is_active: !category.is_active })
        .eq("id", category.id);
      if (error) {
        toast.error("Could not update", { description: error.message });
        return;
      }
      router.refresh();
    });
  }

  function remove(category: Category) {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("categories").delete().eq("id", category.id);
      if (error) {
        toast.error("Could not delete", {
          description: "Events may still reference this category. Deactivate it instead.",
        });
        return;
      }
      toast.success("Category deleted");
      router.refresh();
    });
  }

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
              <p className="truncate text-[14px] font-medium text-ink">{category.name}</p>
              <p className="truncate text-[12px] text-ink-3">/{category.slug}</p>
            </div>
            <Switch
              checked={category.is_active}
              onCheckedChange={() => toggle(category)}
              label={`Toggle ${category.name}`}
            />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete ${category.name}`}
              onClick={() => remove(category)}
            >
              <Trash2 />
            </Button>
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
