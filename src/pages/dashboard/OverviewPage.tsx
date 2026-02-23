import { MessageSquare, Users, Calendar, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

export default function OverviewPage() {
  const { business, token } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", business?.id],
    queryFn: async () => {
      const res = await fetch(`http://localhost:3001/api/dashboard/${business?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      return res.json();
    }
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>;
  if (!data) return <div className="p-8 text-center text-destructive">Failed to load payload</div>;

  const { stats, recentConversations } = data;

  const statCards = [
    { label: "Messages Today", value: stats.messagesUsed?.toString() || "0", icon: <MessageSquare className="w-5 h-5" />, trend: "Limit: " + stats.messageLimit },
    { label: "Active Conversations", value: stats.activeConversations?.toString() || "0", icon: <Users className="w-5 h-5" />, trend: "Today" },
    { label: "Bookings This Week", value: stats.bookingsThisWeek?.toString() || "0", icon: <Calendar className="w-5 h-5" />, trend: "Auto-scheduled" },
    { label: "Reviews Collected", value: stats.reviewsCollected?.toString() || "0", icon: <AlertCircle className="w-5 h-5" />, trend: "Via WhatsApp" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
        <div className="text-sm font-medium px-3 py-1 bg-primary/10 text-primary rounded-full">
          System Status: Online
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="p-5 rounded-xl bg-card border border-border shadow-card hover:shadow-glow transition-all duration-300 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-background rounded-lg text-primary ring-1 ring-border shadow-sm">
                  {stat.icon}
                </div>
                {stat.trend && (
                  <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                    {stat.trend}
                  </span>
                )}
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground tracking-tight">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Conversations */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Recent AI Conversations
          </h3>
          <div className="space-y-4">
            {recentConversations.length === 0 ? <p className="text-sm text-muted-foreground">No recent conversations.</p> : recentConversations.map((conv: any, i: number) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-lg">
                  {conv.lang}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <p className="text-sm font-medium text-foreground truncate">{conv.phone}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{conv.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{conv.preview}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Usage */}
        <div className="rounded-xl bg-card border border-border shadow-card p-5">
          <h2 className="font-semibold text-foreground mb-4">Message Usage</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{stats.messagesUsed} / {stats.messageLimit} messages</span>
              <span className="font-medium text-foreground">{Math.round(stats.usagePercent)}%</span>
            </div>
            <Progress value={stats.usagePercent} className="h-2" />
            <p className="text-xs text-muted-foreground">Resets on the 1st of next month</p>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-sm font-medium text-foreground mb-1">Upgrade to Pro</p>
            <p className="text-xs text-muted-foreground mb-3">Get unlimited messages and advanced analytics.</p>
            <button className="text-xs font-semibold text-primary hover:underline">Learn more →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
