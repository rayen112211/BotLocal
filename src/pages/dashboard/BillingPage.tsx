import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function BillingPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-foreground">Billing</h1>

      {/* Current Plan */}
      <div className="p-6 rounded-xl bg-card border border-border shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-foreground">Starter Plan</h2>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">Active</Badge>
            </div>
            <p className="text-muted-foreground text-sm">$29/month · Trial ends March 8, 2026</p>
          </div>
          <Button variant="hero">Upgrade Plan</Button>
        </div>

        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-medium text-foreground">Included Features</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {["500 messages/month", "1 language", "Basic analytics", "WhatsApp chatbot", "Booking management"].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Messages used this month</span>
            <span className="font-medium text-foreground">124 / 500</span>
          </div>
          <Progress value={25} className="h-2" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline">Change Plan</Button>
        <Button variant="ghost" className="text-destructive hover:text-destructive">Cancel Subscription</Button>
      </div>
    </div>
  );
}
