import { FormSkeleton, Shimmer } from "@/components/ui/skeleton";

export default function NewEventLoading() {
  return (
    <div className="max-w-3xl space-y-6">
      <Shimmer className="h-3 w-16" />
      <Shimmer className="h-7 w-56" />
      <FormSkeleton fields={5} />
      <FormSkeleton fields={2} />
    </div>
  );
}
