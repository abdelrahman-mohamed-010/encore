import { Shimmer } from "@/components/ui/skeleton";

export default function CheckoutLoading() {
  return (
    <div className="container-page py-8 md:py-10">
      <Shimmer className="mb-6 h-3 w-28" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
        <div className="space-y-6">
          <Shimmer className="h-9 w-40" />
          <Shimmer className="h-12 w-full rounded-xl" />
          <Shimmer className="h-56 rounded-xl" />
        </div>
        <Shimmer className="h-96 rounded-xl" />
      </div>
    </div>
  );
}
