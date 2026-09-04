import { FormSkeleton, PageHeaderSkeleton } from "@/components/ui/skeleton";

export default function OrganizerSettingsLoading() {
  return (
    <div className="max-w-2xl space-y-6">
      <PageHeaderSkeleton withAction={false} />
      <FormSkeleton fields={5} />
    </div>
  );
}
