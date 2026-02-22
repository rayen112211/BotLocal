import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const conversations = [
  { id: 1, phone: "+1 234 567 890", name: "John D.", lang: "🇺🇸", status: "active", lastMsg: "I'd like to book for Saturday", time: "2m ago",
    messages: [
      { role: "customer", content: "Hi, do you have availability this Saturday?", time: "10:01 AM", lang: "EN" },
      { role: "bot", content: "Hello John! Yes, we have several slots available this Saturday. What time works best for you?", time: "10:01 AM", lang: "EN" },
      { role: "customer", content: "I'd like to book for Saturday at 3 PM", time: "10:02 AM", lang: "EN" },
      { role: "bot", content: "Great choice! I've reserved a slot for you on Saturday at 3:00 PM. Would you like me to confirm this booking?", time: "10:02 AM", lang: "EN" },
    ]
  },
  { id: 2, phone: "+33 6 12 34 56", name: "Marie L.", lang: "🇫🇷", status: "active", lastMsg: "Bonjour, quels sont vos horaires?", time: "15m ago",
    messages: [
      { role: "customer", content: "Bonjour, quels sont vos horaires d'ouverture?", time: "9:45 AM", lang: "FR" },
      { role: "bot", content: "Bonjour Marie! Nous sommes ouverts du lundi au samedi, de 9h à 21h. Comment puis-je vous aider?", time: "9:45 AM", lang: "FR" },
    ]
  },
  { id: 3, phone: "+212 6 12 34 56", name: "Ahmed B.", lang: "🇲🇦", status: "active", lastMsg: "هل لديكم مواعيد متاحة غداً", time: "1h ago",
    messages: [
      { role: "customer", content: "هل لديكم مواعيد متاحة غداً؟", time: "9:00 AM", lang: "AR" },
      { role: "bot", content: "مرحباً أحمد! نعم، لدينا مواعيد متاحة غداً. ما الوقت المناسب لك؟", time: "9:00 AM", lang: "AR" },
    ]
  },
];

export default function ConversationsPage() {
  const [selected, setSelected] = useState(conversations[0]);
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Conversations</h1>

      <div className="flex rounded-xl bg-card border border-border shadow-card overflow-hidden" style={{ height: "calc(100vh - 180px)" }}>
        {/* List */}
        <div className="w-80 border-r border-border flex flex-col">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations..." className="pl-9" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${selected.id === c.id ? "bg-muted/80" : ""}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span>{c.lang}</span>
                    <span className="text-sm font-medium text-foreground">{c.name || c.phone}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{c.time}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{c.lastMsg}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">{selected.lang}</span>
              <div>
                <p className="font-medium text-foreground">{selected.name || selected.phone}</p>
                <p className="text-xs text-muted-foreground">{selected.phone}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">Create Booking</Button>
              <Button size="sm" variant="ghost"><X className="w-4 h-4 mr-1" /> Mark Closed</Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {selected.messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "bot" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                  msg.role === "bot"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                }`}>
                  <p>{msg.content}</p>
                  <div className={`flex items-center gap-2 mt-1 text-xs ${msg.role === "bot" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    <span>{msg.time}</span>
                    <Badge variant="outline" className="text-[10px] px-1 py-0 border-current/20">{msg.lang}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
