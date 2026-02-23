import { useState, useEffect } from "react";
import { Search, X, Loader, MessageCircle, Bot, User, Power, PowerOff, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { conversationsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function ConversationsPage() {
  const { business } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);

  useEffect(() => {
    if (business?.id) {
      loadConversations();
    }
  }, [business?.id]);

  useEffect(() => {
    if (selected && business?.id) {
      loadMessages();
    }
  }, [selected, business?.id]);

  const loadConversations = async () => {
    try {
      const res = await conversationsAPI.getAll(business!.id);
      setConversations(res.data);
      if (res.data.length > 0 && !selected) {
        setSelected(res.data[0]);
      }
    } catch (error) {
      console.error("Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async () => {
    setIsMessagesLoading(true);
    try {
      const res = await conversationsAPI.getById(business!.id, selected.customerPhone);
      setMessages(res.data.messages || []);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load messages" });
    } finally {
      setIsMessagesLoading(false);
    }
  };

  const toggleAI = async () => {
    if (!selected) return;
    try {
      const newStatus = !selected.isAiEnabled;
      await conversationsAPI.toggleAi(selected.id, newStatus);
      setSelected({ ...selected, isAiEnabled: newStatus });
      setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, isAiEnabled: newStatus } : c));
      toast({
        title: newStatus ? "AI Enabled" : "Human Takeover Active",
        description: newStatus ? "The bot will now reply to this customer." : "The AI is paused. You can now reply manually."
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to toggle AI status" });
    }
  };

  const filteredConversations = conversations.filter(c =>
    c.customerPhone.toLowerCase().includes(search.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 h-[calc(100vh-140px)]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Unified Inbox</h1>
        <Badge variant="secondary" className="px-3 py-1">
          {conversations.length} Active Chats
        </Badge>
      </div>

      <div className="flex rounded-2xl bg-card border border-border shadow-sm overflow-hidden h-full">
        {/* List */}
        <div className="w-80 border-r border-border flex flex-col bg-muted/20">
          <div className="p-4 border-b border-border bg-card">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chats..."
                className="pl-9 h-10 rounded-xl"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border/50">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No chats found</p>
              </div>
            ) : (
              filteredConversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={`w-full text-left p-4 hover:bg-muted/50 transition-all ${selected?.id === c.id ? "bg-white shadow-sm ring-1 ring-border/50 scale-[1.02] z-10" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${c.isAiEnabled ? 'bg-success' : 'bg-orange-500 animate-pulse'}`}></div>
                      <span className="text-sm font-bold text-foreground">{c.customerPhone}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate leading-relaxed">{c.lastMessage}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col bg-white">
          {selected ? (
            <>
              <div className="p-4 border-b border-border flex items-center justify-between bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{selected.customerPhone}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] h-4 ${!selected.isAiEnabled ? "bg-amber-100 text-amber-700 border-amber-200" : ""}`}>
                        {selected.isAiEnabled ? "AI Active" : "Human Mode"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={selected.isAiEnabled ? "outline" : "default"}
                    size="sm"
                    className="rounded-xl font-bold"
                    onClick={toggleAI}
                  >
                    {selected.isAiEnabled ? (
                      <><PowerOff className="w-4 h-4 mr-2" /> Pause AI</>
                    ) : (
                      <><Power className="w-4 h-4 mr-2" /> Resume AI</>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8f9fa]">
                {isMessagesLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader className="w-6 h-6 animate-spin text-primary/50" />
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "assistant" || msg.role === "bot" ? "justify-start" : "justify-end"}`}>
                      <div className={`flex flex-col gap-1 max-w-[80%] ${msg.role === "assistant" || msg.role === "bot" ? "items-start" : "items-end"}`}>
                        <div className={`flex items-center gap-2 mb-1`}>
                          {msg.role === "assistant" || msg.role === "bot" ? (
                            <Badge variant="outline" className="text-[9px] h-4 flex gap-1 items-center bg-white">
                              <Bot className="w-3 h-3 text-primary" /> AI
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] h-4 flex gap-1 items-center bg-white">
                              <User className="w-3 h-3 text-muted-foreground" /> Customer
                            </Badge>
                          )}
                        </div>
                        <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm leading-relaxed ${msg.role === "assistant" || msg.role === "bot"
                          ? "bg-white text-foreground border border-border rounded-tl-none"
                          : "bg-primary text-primary-foreground rounded-tr-none"
                          }`}>
                          <p>{msg.content}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1 px-1">
                          {msg.time || "Just now"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {!selected.isAiEnabled && (
                <div className="p-4 border-t border-border bg-amber-50">
                  <p className="text-xs font-bold text-amber-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    AI is paused. You can reply to this message directly in your Telegram app.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
              <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center">
                <MessageCircle className="w-10 h-10 opacity-20" />
              </div>
              <p className="font-medium">Select a conversation to start</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
