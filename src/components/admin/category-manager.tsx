"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/surface";
import { Field, Input, Switch } from "@/components/ui/input";
import type { Category } from "@/lib/types";

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#2a78d6");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  async function add(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (name.trim().length < 2) return setError("Give the category a name.");

    setSaving(true);
    const supabase = createClient();
    const { error: writeError } = await supabase.from("categories").insert({
      name: name.trim(),
      slug: slugify(name),
      color,
      sort_order: categories.length + 1,
    });
    setSaving(false);

    if (writeError) {
      setError(writeError.code === "23505" ? "That category already exists." : writeError.message);
      return;
    }

    toast.success("Category added");
    setName("");
    router.refresh();
  }

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
        <form onSubmit={add} className="flex flex-wrap items-end gap-3 p-4">
          <Field label="New category" htmlFor="categoryName" error={error} className="min-w-48 flex-1">
            <Input
              id="categoryName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Workshops"
              aria-invalid={Boolean(error)}
            />
          </Field>
          <Field label="Colour" htmlFor="categoryColor">
            <input
              id="categoryColor"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-16 cursor-pointer rounded-lg border border-hairline bg-card p-1"
            />
          </Field>
          <Button type="submit" variant="solid" loading={saving}>
            <Plus /> Add
          </Button>
        </form>
      </Card>
    </div>
  );
}
