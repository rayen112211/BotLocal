import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, MessageSquare, Users, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";

// Mock data
const messageData = [
  { day: "Mon", messages: 45 },
  { day: "Tue", messages: 52 },
  { day: "Wed", messages: 48 },
  { day: "Thu", messages: 61 },
  { day: "Fri", messages: 73 },
  { day: "Sat", messages: 68 },
  { day: "Sun", messages: 39 }
];

const conversationData = [
  { name: "Completed", value: 48, color: "#10b981" },
  { name: "Pending", value: 12, color: "#f59e0b" },
  { name: "Support Needed", value: 5, color: "#ef4444" }
];

const languageData = [
  { name: "English", value: 42 },
  { name: "French", value: 28 },
  { name: "Italian", value: 18 },
  { name: "Arabic", value: 12 }
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Analytics</h1>
        <p className="text-muted-foreground">Track your bot's performance and customer engagement</p>
      </div>

      {/* Key Metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Messages This Week</p>
              <p className="text-3xl font-bold text-foreground mt-2">386</p>
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +12% vs last week
              </p>
            </div>
            <MessageSquare className="w-8 h-8 text-primary/20" />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Conversations</p>
              <p className="text-3xl font-bold text-foreground mt-2">65</p>
              <p className="text-xs text-muted-foreground mt-2">Avg response time: 2s</p>
            </div>
            <Users className="w-8 h-8 text-primary/20" />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Bookings Created</p>
              <p className="text-3xl font-bold text-foreground mt-2">18</p>
              <p className="text-xs text-green-600 mt-2">+2 this week</p>
            </div>
            <Calendar className="w-8 h-8 text-primary/20" />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Customer Satisfaction</p>
              <p className="text-3xl font-bold text-foreground mt-2">94%</p>
              <p className="text-xs text-muted-foreground mt-2">Based on 47 reviews</p>
            </div>
            <div className="text-2xl">⭐</div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Messages Trend */}
        <Card className="p-6">
          <h2 className="font-semibold text-foreground mb-4">Messages Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={messageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px"
                }}
              />
              <Line type="monotone" dataKey="messages" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Conversation Status */}
        <Card className="p-6">
          <h2 className="font-semibold text-foreground mb-4">Conversation Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={conversationData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                {conversationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Languages */}
        <Card className="p-6">
          <h2 className="font-semibold text-foreground mb-4">Languages Used</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={languageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px"
                }}
              />
              <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Customers */}
        <Card className="p-6">
          <h2 className="font-semibold text-foreground mb-4">Top Customer Issues</h2>
          <div className="space-y-3">
            {[
              { issue: "Booking appointments", count: 124, percentage: 32 },
              { issue: "Business hours", count: 87, percentage: 23 },
              { issue: "Menu/services", count: 76, percentage: 20 },
              { issue: "Pricing", count: 65, percentage: 17 },
              { issue: "Contact info", count: 28, percentage: 8 }
            ].map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-foreground">{item.issue}</p>
                  <span className="text-xs font-medium text-muted-foreground">{item.count}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Export Section */}
      <Card className="p-6">
        <h2 className="font-semibold text-foreground mb-4">Export Data</h2>
        <p className="text-muted-foreground mb-4">Download your analytics as CSV or PDF for reports</p>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-input rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">
            📊 Download CSV
          </button>
          <button className="px-4 py-2 border border-input rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">
            📄 Download PDF
          </button>
        </div>
      </Card>
    </div>
  );
}
