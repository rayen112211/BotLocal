import { Star, Send, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const reviews = [
  { id: 1, customer: "John D.", phone: "+1 234 567 890", sentAt: "Feb 22, 2026", status: "clicked" },
  { id: 2, customer: "Sofia R.", phone: "+39 333 123 4567", sentAt: "Feb 21, 2026", status: "sent" },
  { id: 3, customer: "Marie L.", phone: "+33 6 12 34 56", sentAt: "Feb 20, 2026", status: "ignored" },
];

const statusColors: Record<string, string> = {
  sent: "bg-info/10 text-info border-info/20",
  clicked: "bg-success/10 text-success border-success/20",
  ignored: "bg-muted text-muted-foreground border-border",
};

export default function ReviewRequestsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Review Requests</h1>
        <Button variant="hero" size="sm"><Send className="w-4 h-4 mr-1" /> Send Review Request</Button>
      </div>

      <div className="rounded-xl bg-card border border-border shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Customer</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Phone</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Sent</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {reviews.map((r) => (
              <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                <td className="p-4 text-sm font-medium text-foreground">{r.customer}</td>
                <td className="p-4 text-sm text-muted-foreground">{r.phone}</td>
                <td className="p-4 text-sm text-muted-foreground">{r.sentAt}</td>
                <td className="p-4"><Badge variant="outline" className={`capitalize ${statusColors[r.status]}`}>{r.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-card border border-border shadow-card text-center">
          <Star className="w-8 h-8 text-warning mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">42</p>
          <p className="text-sm text-muted-foreground">Total Sent</p>
        </div>
        <div className="p-5 rounded-xl bg-card border border-border shadow-card text-center">
          <ExternalLink className="w-8 h-8 text-success mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">28</p>
          <p className="text-sm text-muted-foreground">Clicked</p>
        </div>
        <div className="p-5 rounded-xl bg-card border border-border shadow-card text-center">
          <p className="text-2xl font-bold text-success mb-1">67%</p>
          <p className="text-sm text-muted-foreground">Click Rate</p>
        </div>
      </div>
    </div>
  );
}
