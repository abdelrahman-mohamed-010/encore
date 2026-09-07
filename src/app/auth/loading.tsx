import { Shimmer } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <div className="space-y-7">
      <div className="space-y-2.5 text-center">
        <Shimmer className="mx-auto h-7 w-48" />
        <Shimmer className="mx-auto h-3.5 w-64" />
      </div>
      <div className="space-y-4 rounded-2xl bg-card shadow-e1 p-6">
        <Shimmer className="h-11 w-full" />
        <Shimmer className="h-11 w-full" />
        <Shimmer className="h-px w-full" />
        <Shimmer className="h-16 w-full" />
        <Shimmer className="h-16 w-full" />
        <Shimmer className="h-11 w-full" />
      </div>
    </div>
  );
}
