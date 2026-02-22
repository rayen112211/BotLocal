import { Button } from "@/components/ui/button";
import { Globe, Plus, Trash2, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast"; // Assuming useToast is from shadcn/ui

export default function KnowledgeBasePage() {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");
  const { business, token } = useAuth();
  const { toast } = useToast();

  // Fetch real data from express DB
  const { data: chunks = [], isLoading } = useQuery({
    queryKey: ["knowledgeBase", business?.id],
    queryFn: async () => {
      const res = await fetch(`http://localhost:3001/api/scanner/${business?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch knowledge base");
      return res.json();
    }
  });

  const scanMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await fetch("http://localhost:3001/api/scanner", {
        method: "POST",
        headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ businessId: business?.id, url })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to scan website");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledgeBase", business?.id] });
      toast({
        title: "Website scanned successfully!",
        description: "AI is now learning it.",
      });
      setUrl("");
    },
    onError: (err: any) => toast({
      title: "Scan failed",
      description: err.message,
      variant: "destructive",
    })
  });

  const handleScan = () => {
    if (scanUrl) {
      toast.loading("Scanning website...", { id: "scan" });
      scanMutation.mutate(scanUrl, { onSettled: () => toast.dismiss("scan") });
    } else {
      toast.error("Please enter a valid URL");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Knowledge Base</h1>
        <div className="flex gap-2 items-center">
          <input
            type="url"
            placeholder="https://example.com"
            value={scanUrl}
            onChange={(e) => setScanUrl(e.target.value)}
            className="h-9 px-3 py-1 flex h-9 w-full rounded-md border border-input bg-transparent text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Button variant="outline" size="sm" onClick={handleScan} disabled={scanMutation.isPending || !scanUrl}>
            <RefreshCw className={`w-4 h-4 mr-1 ${scanMutation.isPending ? 'animate-spin' : ''}`} />
            {scanMutation.isPending ? "Scanning..." : "Scan URL"}
          </Button>
          <Button variant="hero" size="sm"><Plus className="w-4 h-4 mr-1" /> Add Manual</Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {isLoading ? (
          <p className="text-muted-foreground p-4">Loading knowledge base...</p>
        ) : chunks.length === 0 ? (
          <p className="text-muted-foreground p-4">No data found. Click Scan Website to add your content.</p>
        ) : chunks.map((chunk: any) => (
          <div key={chunk.id} className="p-5 rounded-xl bg-card border border-border shadow-card group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`px-2 py-0.5 rounded text-xs font-medium bg-info/10 text-info`}>
                  <Globe className="w-3 h-3 inline mr-1" />Website
                </div>
                <span className="text-xs text-muted-foreground">{new Date(chunk.createdAt || chunk.date).toLocaleDateString()}</span>
              </div>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {chunk.url && <p className="text-xs text-muted-foreground mb-2 truncate">{chunk.url}</p>}
            <p className="text-sm text-foreground leading-relaxed line-clamp-4" title={chunk.content}>{chunk.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
