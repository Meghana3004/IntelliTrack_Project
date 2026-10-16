import { LiveMap } from "@/components/tracking/live-map";

export default function RegionalLivePage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-8">
      <h1 className="text-2xl font-semibold text-foreground">Live Tracking</h1>
      <LiveMap />
    </div>
  );
}
