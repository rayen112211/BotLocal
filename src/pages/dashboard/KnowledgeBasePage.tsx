import { useState } from "react";
import { BookOpen, Trash2, RefreshCw, Plus, Check, AlertCircle, Loader } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { scannerAPI } from "@/lib/api";

export default function KnowledgeBasePage() {
  const { toast } = useToast();
  const [newUrl, setNewUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["knowledge-base"],
    queryFn: async () => {
      const res = await scannerAPI.getAll();
      return res.data;
    }
  });

  const handleAddUrl = async () => {
    if (!newUrl) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a URL" });
      return;
    }

    setIsScanning(true);

    try {
      const res = await scannerAPI.scan(newUrl);
      const result = res.data;

      toast({
        title: "Success!",
        description: "Website scanned and added to knowledge base"
      });

      setNewUrl("");
      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Scan failed",
        description: error.message
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleRescan = async (entryId: string) => {
    try {
      await scannerAPI.rescan(entryId);

      toast({ title: "Success", description: "Website rescanned successfully" });
      refetch();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm("Delete this knowledge base entry?")) return;

    try {
      await scannerAPI.delete(entryId);

      toast({ title: "Success", description: "Entry deleted" });
      refetch();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Knowledge Base</h1>
        <p className="text-muted-foreground">
          Add your business website URLs so your AI can learn about you and answer customer questions accurately.
        </p>
      </div>

      {/* Add URL Section */}
      <Card className="p-6">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add New Website
        </h2>

        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://yourrestaurant.com"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            disabled={isScanning}
          />
          <Button
            onClick={handleAddUrl}
            disabled={isScanning}
            className="gap-2"
          >
            {isScanning ? (
              <>
                <Loader className="w-4 h-4 animate-spin" /> Scanning...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Scan
              </>
            )}
          </Button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-800">
            <p className="font-medium mb-1">Tips for best results:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Make sure your website is public and accessible</li>
              <li>Include services, prices, hours, and contact info on your site</li>
              <li>Update your knowledge base if you change your services or hours</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Knowledge Base Entries */}
      <div>
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4" /> Your Knowledge Base
        </h2>

        {isLoading ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </Card>
        ) : !data?.entries || data.entries.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground mb-2">No websites added yet</h3>
            <p className="text-muted-foreground">
              Add your first website URL above to get started.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {data.entries.map((entry: any) => (
              <Card key={entry.id} className="p-5 hover:shadow-card transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-lg break-all">
                      {entry.url}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {entry.pagesScanned || 1} {entry.pagesScanned === 1 ? 'page' : 'pages'} scanned • {entry.contentLength.toLocaleString()} characters • Added{" "}
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium ml-2">
                    <Check className="w-3 h-3" /> Indexed
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRescan(entry.id)}
                    className="gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Rescan
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(entry.id)}
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
    </div>
  );
}
