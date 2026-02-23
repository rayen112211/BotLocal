import { useState } from "react";
import { Calendar, Phone, Clock, MapPin, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { bookingsAPI } from "@/lib/api";

export default function BookingsPage() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["bookings", filter],
    queryFn: async () => {
      const res = await bookingsAPI.getAll();
      const result = res.data;

      if (filter === "all") return result.bookings || [];
      return (result.bookings || []).filter((b: any) => b.status === filter);
    }
  });

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      await bookingsAPI.updateStatus(bookingId, newStatus);

      toast({ title: "Success", description: `Booking updated to ${newStatus}` });
      refetch();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleDelete = async (bookingId: string) => {
    if (!confirm("Are you sure?")) return;

    try {
      await bookingsAPI.delete(bookingId);

      toast({ title: "Success", description: "Booking deleted" });
      refetch();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "confirmed": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Bookings</h1>
        <div className="flex gap-2">
          {(["all", "pending", "completed"] as const).map(f => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading bookings...</p>
        </div>
      ) : !data || data.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-2">No bookings yet</h3>
          <p className="text-muted-foreground">
            Customers will be able to book appointments through Telegram once your bot is live.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {data.map((booking: any) => (
            <Card key={booking.id} className="p-5 hover:shadow-card transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground text-lg">{booking.customerName}</h3>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                    <Phone className="w-4 h-4" />
                    {booking.customerPhone}
                  </div>
                </div>
                <Badge className={getStatusColor(booking.status)}>
                  {booking.status}
                </Badge>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-foreground">{new Date(booking.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-foreground">{booking.time}</span>
                </div>
              </div>

              {booking.notes && (
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">{booking.notes}</p>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {booking.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(booking.id, "confirmed")}
                      className="gap-1"
                    >
                      <CheckCircle className="w-3 h-3" /> Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(booking.id, "cancelled")}
                      className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <AlertCircle className="w-3 h-3" /> Decline
                    </Button>
                  </>
                )}

                {booking.status === "confirmed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(booking.id, "completed")}
                    className="gap-1"
                  >
                    <CheckCircle className="w-3 h-3" /> Mark Complete
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(booking.id)}
                  className="gap-1 text-destructive hover:bg-destructive/10 ml-auto"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
