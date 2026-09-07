import { Shimmer } from "@/components/ui/skeleton";

export default function EventsMapLoading() {
  return (
    <div className="flex h-dvh w-screen flex-col bg-paper overflow-hidden">
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-hairline bg-card/90 px-4">
        <Shimmer className="h-4 w-32" />
      </div>
      <Shimmer className="min-h-0 flex-1 rounded-none" />
    </div>
  );
}
