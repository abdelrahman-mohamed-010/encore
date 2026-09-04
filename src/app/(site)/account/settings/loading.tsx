import { FormSkeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="max-w-xl">
      <FormSkeleton fields={5} />
    </div>
  );
}
