import { Shimmer } from "@/components/ui/skeleton";

export default function CheckoutLoading() {
  return (
    <div className="container-page py-8 md:py-10">
      <Shimmer className="mb-6 h-3 w-28" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
        <div className="space-y-6">
          <Shimmer className="h-9 w-40" />
          <Shimmer className="h-12 w-full rounded-xl" />
          <div className="rounded-xl bg-card shadow-e1">
            <div className="border-b border-hairline-soft px-5 py-4">
              <Shimmer className="h-3.5 w-24" />
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Shimmer className="h-16 sm:col-span-2" />
              <Shimmer className="h-16" />
              <Shimmer className="h-16" />
            </div>
          </div>
        </div>
        <Shimmer className="h-96 rounded-xl" />
      </div>
    </div>
  );
}
