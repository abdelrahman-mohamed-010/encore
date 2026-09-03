import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SectionHeader } from "@/components/ui/surface";
import { CategoryManager } from "@/components/admin/category-manager";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("*").order("sort_order");

  return (
    <div className="max-w-2xl space-y-6">
      <SectionHeader
        level={1}
        title="Categories"
        description="The taxonomy every organizer picks from when creating an event."
      />
      <CategoryManager categories={categories ?? []} />
    </div>
  );
}
