import { FormSkeleton, PageHeaderSkeleton } from "@/components/ui/skeleton";

export default function OrganizerSettingsLoading() {
  return (
    <div className="max-w-2xl space-y-6 px-5 py-8 md:px-8">
      <PageHeaderSkeleton withAction={false} />
      <FormSkeleton fields={5} />
    </div>
  );
}
