import { useState } from "react";
import { Star, Send, CheckCircle, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function ReviewRequestsPage() {
  const { business, token } = useAuth();
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["bookings", business?.id],
    queryFn: async () => {
      const res = await fetch(
        "http://localhost:3001/api/bookings",
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    }
  });

  const handleSendReview = async (bookingId: string) => {
    try {
      const res = await fetch(
        `http://localhost:3001/api/bookings/${bookingId}/send-review`,
        {
          method: "POST",
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!res.ok) throw new Error("Failed to send");

      toast({
        title: "Review request sent!",
        description: "Customer will receive a Google review request"
      });
      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const completedBookings = data?.bookings?.filter((b: any) => b.status === "completed") || [];
  const pendingReviews = completedBookings.filter((b: any) => !b.reviewSent);
  const sentReviews = completedBookings.filter((b: any) => b.reviewSent);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Review Requests</h1>
        <p className="text-muted-foreground">Automatically request Google reviews from satisfied customers</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Total Completed</p>
          <p className="text-3xl font-bold text-foreground mt-2">{completedBookings.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Review Requests Sent</p>
          <p className="text-3xl font-bold text-foreground mt-2">{sentReviews.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Pending Requests</p>
          <p className="text-3xl font-bold text-foreground mt-2">{pendingReviews.length}</p>
        </Card>
      </div>

      {/* Pending Reviews */}
      <div>
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Pending Review Requests ({pendingReviews.length})
        </h2>

        {isLoading ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </Card>
        ) : pendingReviews.length === 0 ? (
          <Card className="p-12 text-center">
            <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground mb-2">All caught up!</h3>
            <p className="text-muted-foreground">
              You've requested reviews from all completed bookings.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingReviews.map((booking: any) => (
              <Card key={booking.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{booking.customerName}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{booking.customerPhone}</p>
                  </div>
                  <Badge variant="outline">Completed</Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <span>Visited: {new Date(booking.date).toLocaleDateString()}</span>
                </div>

                <Button
                  onClick={() => handleSendReview(booking.id)}
                  className="gap-2"
                >
                  <Send className="w-4 h-4" /> Send Review Request
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Sent Reviews */}
      {sentReviews.length > 0 && (
        <div>
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" /> Reviews Requested ({sentReviews.length})
          </h2>

          <div className="grid gap-4">
            {sentReviews.slice(0, 5).map((booking: any) => (
              <Card key={booking.id} className="p-5 bg-green-50 border-green-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{booking.customerName}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{booking.customerPhone}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Requested</Badge>
                </div>
              </Card>
            ))}
          </div>

          {sentReviews.length > 5 && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              ... and {sentReviews.length - 5} more
            </p>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">How it works</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>After a booking is marked complete, you can request a review</li>
          <li>Your bot will automatically send a WhatsApp message asking for a Google review</li>
          <li>Reviews help build credibility and attract more customers</li>
          <li>Customers can easily leave a review through the link in the message</li>
        </ul>
      </div>
    </div>
  );
}
