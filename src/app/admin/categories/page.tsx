import type { Metadata } from "next";
import { listAllCategories } from "@/features/admin/queries";
import { SectionHeader } from "@/components/ui/surface";
import { CategoryManager } from "@/components/admin/category-manager";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const categories = await listAllCategories();

  return (
    <div className="max-w-2xl space-y-6">
      <SectionHeader
        level={1}
        title="Categories"
        description="The taxonomy every organizer picks from when creating an event."
      />
      <CategoryManager categories={categories} />
    </div>
  );
}
