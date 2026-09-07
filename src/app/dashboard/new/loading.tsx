import { FormSkeleton, Shimmer } from "@/components/ui/skeleton";

export default function NewOrganizerLoading() {
  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-lg space-y-6">
        <Shimmer className="h-3 w-20" />
        <Shimmer className="h-8 w-64" />
        <FormSkeleton fields={4} />
      </div>
    </div>
  );
}
