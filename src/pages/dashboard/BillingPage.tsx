import { useState } from "react";
import { CreditCard, Check, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "$0",
    period: "/month",
    description: "Perfect for trying out",
    features: [
      "Up to 500 messages/month",
      "Basic analytics",
      "Multi-language support",
      "Email support"
    ],
    recommended: false
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "Best for growing businesses",
    features: [
      "Up to 5,000 messages/month",
      "Advanced analytics",
      "Priority support",
      "Custom branding",
      "API access"
    ],
    recommended: true
  },
  {
    id: "agency",
    name: "Agency",
    price: "$99",
    period: "/month",
    description: "For managing multiple businesses",
    features: [
      "Unlimited messages",
      "Full analytics & reporting",
      "Dedicated support",
      "White label solution",
      "API & Webhooks",
      "Custom integrations"
    ],
    recommended: false
  }
];

export default function BillingPage() {
  const { business, token } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const { data: subscription } = useQuery({
    queryKey: ["subscription", business?.id],
    queryFn: async () => {
      // Mocking subscription data until backend route is fully implemented
      return { subscription: { plan: business?.plan || "Starter", messagesUsed: business?.messageCount || 0, messageLimit: business?.plan === 'Pro' ? 5000 : 500, percentageUsed: business ? Math.round((business.messageCount / (business.plan === 'Pro' ? 5000 : 500)) * 100) : 0 } };
    },
    enabled: !!business,
  });

  const handleUpgrade = async (plan: typeof PLANS[0]) => {
    try {
      if (!business) return;

      const res = await api.post('/stripe/create-checkout-session', {
        planId: plan.id,
        businessId: business.id
      });

      const data = res.data;

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({ title: "Success", description: "Checkout created" });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || error.message
      });
    }
  };

  const currentPlan = subscription?.subscription?.plan || "Starter";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Billing & Plans</h1>
        <p className="text-muted-foreground">Manage your subscription and upgrade anytime</p>
      </div>

      {/* Current Plan */}
      {subscription?.subscription && (
        <Card className="p-6 border-primary/30 bg-primary/5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-semibold text-foreground">Current Plan</h2>
              <p className="text-muted-foreground text-sm mt-1">{currentPlan}</p>
            </div>
            <Badge className="bg-primary">{currentPlan}</Badge>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Messages Used</p>
              <p className="font-semibold text-foreground">{subscription.subscription.messagesUsed} / {subscription.subscription.messageLimit}</p>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary rounded-full h-2 transition-all"
                style={{ width: `${subscription.subscription.percentageUsed}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{subscription.subscription.percentageUsed}% used</p>
          </div>

          {currentPlan !== "Agency" && (
            <Button className="gap-2">
              Upgrade Plan <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </Card>
      )}

      {/* Plans */}
      <div>
        <h2 className="font-semibold text-foreground mb-4">Choose Your Plan</h2>

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <Card
              key={plan.id}
              className={`p-6 flex flex-col transition-all ${currentPlan === plan.name
                ? 'border-primary ring-2 ring-primary/20'
                : ''
                } ${plan.recommended
                  ? 'md:ring-2 md:ring-primary/20 md:border-primary'
                  : ''
                }`}
            >
              {plan.recommended && (
                <Badge className="w-fit mb-3 bg-primary">Recommended</Badge>
              )}

              <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-6 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={currentPlan === plan.name ? "default" : "outline"}
                className="w-full"
                onClick={() => handleUpgrade(plan)}
                disabled={currentPlan === plan.name}
              >
                {currentPlan === plan.name ? "Current Plan" : `Choose ${plan.name}`}
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <div>
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4" /> Billing History
        </h2>

        <Card className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="text-left p-4 font-medium text-foreground text-sm">Invoice</th>
                <th className="text-left p-4 font-medium text-foreground text-sm">Date</th>
                <th className="text-left p-4 font-medium text-foreground text-sm">Amount</th>
                <th className="text-left p-4 font-medium text-foreground text-sm">Status</th>
                <th className="text-left p-4 font-medium text-foreground text-sm"></th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: "INV-001", date: "Mar 1, 2026", amount: "$0.00", status: "Paid" },
                { id: "INV-002", date: "Feb 1, 2026", amount: "$0.00", status: "Paid" },
                { id: "INV-003", date: "Jan 1, 2026", amount: "$0.00", status: "Paid" }
              ].map((invoice, i) => (
                <tr key={i} className="border-b border-border hover:bg-muted/50">
                  <td className="p-4 text-sm text-foreground">{invoice.id}</td>
                  <td className="p-4 text-sm text-muted-foreground">{invoice.date}</td>
                  <td className="p-4 text-sm text-foreground font-medium">{invoice.amount}</td>
                  <td className="p-4 text-sm">
                    <Badge className="bg-green-100 text-green-800">{invoice.status}</Badge>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-primary hover:underline text-sm font-medium">Download</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Support */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">Need help?</h3>
        <p className="text-sm text-blue-800 mb-4">
          If you have any questions about your subscription or need to make changes, our support team is here to help.
        </p>
        <Button variant="outline" className="border-blue-300 text-blue-900 hover:bg-blue-100">
          Contact Support
        </Button>
      </Card>
    </div>
  );
}
