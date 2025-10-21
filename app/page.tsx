import { SkincareDashboard } from "@/components/skincare-dashboard";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-foreground">
            Your Skincare Dashboard
          </h1>
        </div>
      </div>

      <main className="mx-auto max-w-4xl">
        <SkincareDashboard />
      </main>
    </div>
  );
}
