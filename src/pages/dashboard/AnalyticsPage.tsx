import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Analytics</h1>

      <div className="flex flex-col items-center justify-center py-20 rounded-xl bg-card border border-border shadow-card text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Analytics is a Pro Feature</h2>
        <p className="text-muted-foreground max-w-md mb-6">
          Upgrade to Pro to unlock detailed analytics including messages per day, most asked questions, booking conversion rates, and more.
        </p>
        <Button variant="hero">Upgrade to Pro — $59/mo</Button>
      </div>
    </div>
  );
}
