export default function Loading() {
  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-md space-y-3">
        <div className="h-8 w-2/3 animate-pulse rounded-lg bg-sunken" />
        <div className="h-4 w-full animate-pulse rounded bg-sunken" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-sunken" />
      </div>
    </div>
  );
}
