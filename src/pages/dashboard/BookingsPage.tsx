import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, List, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  confirmed: "bg-success/10 text-success border-success/20",
  completed: "bg-info/10 text-info border-info/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function BookingsPage() {
  const [view, setView] = useState<"list" | "calendar">("list");
  const queryClient = useQueryClient();
  const { business, token } = useAuth(); // Added useAuth hook

  // Fetch real data from express DB
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings", business?.id], // Changed BUSINESS_ID to business?.id
    queryFn: async () => {
      if (!business?.id || !token) { // Added check for business ID and token
        throw new Error("Business ID or token not available.");
      }
      const res = await fetch(`http://localhost:3001/api/bookings/${business.id}`, { // Updated URL and added headers
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return res.json();
    }
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!token) { // Added check for token
        throw new Error("Authentication token not available.");
      }
      const res = await fetch(`http://localhost:3001/api/bookings/${id}/complete`, { // Updated URL and added headers
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to complete booking");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", business?.id] }); // Changed BUSINESS_ID to business?.id
      toast.success("Booking completed and review requested!");
    },
    onError: () => toast.error("Error completing booking")
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Bookings</h1>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button onClick={() => setView("list")} className={`px-3 py-1.5 text-sm ${view === "list" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setView("calendar")} className={`px-3 py-1.5 text-sm ${view === "calendar" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>
              <Calendar className="w-4 h-4" />
            </button>
          </div>
          <Button variant="hero" size="sm"><Plus className="w-4 h-4 mr-1" /> Add Booking</Button>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No bookings found.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Customer</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Service</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Time</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings.map((b: any) => (
                <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <p className="text-sm font-medium text-foreground">{b.customerName || b.customer}</p>
                    <p className="text-xs text-muted-foreground">{b.customerPhone || b.phone}</p>
                  </td>
                  <td className="p-4 text-sm text-foreground">{'Service'}</td>
                  <td className="p-4 text-sm text-foreground">{b.date ? new Date(b.date).toLocaleDateString() : 'N/A'}</td>
                  <td className="p-4 text-sm text-foreground">{b.time}</td>
                  <td className="p-4">
                    <Badge variant="outline" className={`capitalize ${statusColors[b.status] || statusColors.pending}`}>{b.status}</Badge>
                  </td>
                  <td className="p-4">
                    {b.status === "pending" && <Button size="sm" variant="success">Confirm</Button>}
                    {b.status === "confirmed" && <Button size="sm" variant="outline" onClick={() => completeMutation.mutate(b.id)} disabled={completeMutation.isPending}>Complete</Button>}
                    {b.status !== "pending" && b.status !== "confirmed" && <span className="text-xs text-muted-foreground">Done</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
