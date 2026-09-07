import { FormSkeleton, Shimmer } from "@/components/ui/skeleton";

export default function EditEventLoading() {
  return (
    <div className="max-w-3xl space-y-6">
      <Shimmer className="h-3 w-28" />
      <Shimmer className="h-7 w-48" />
      <FormSkeleton fields={5} />
    </div>
  );
}
