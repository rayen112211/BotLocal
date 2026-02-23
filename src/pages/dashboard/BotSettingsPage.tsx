import { useState, useEffect } from "react";
import { Settings, Save, AlertCircle, MessageSquare, CheckCircle2, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { businessAPI } from "@/lib/api";

export default function BotSettingsPage() {
  const { business, refreshBusiness } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    botName: business?.name || "AI Assistant",
    greetingMessage: "Hello! How can I help you today?",
    businessHours: "Mon-Fri: 9 AM - 6 PM",
    autoReplyOutOfHours: "We're currently closed. Please send us a message and we'll get back to you as soon as possible.",
    bookingConfirmation: "Your appointment has been confirmed! We'll see you then.",
    language: "auto-detect",
    telegramBotToken: business?.telegramBotToken || "",
    telegramBotUsername: business?.telegramBotUsername || ""
  });

  useEffect(() => {
    if (business) {
      setSettings(prev => ({
        ...prev,
        botName: business.name || prev.botName,
        telegramBotToken: business.telegramBotToken || prev.telegramBotToken,
        telegramBotUsername: business.telegramBotUsername || prev.telegramBotUsername
      }));
    }
  }, [business]);

  const handleChange = (field: string, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const { data: businessData, refetch: refetchBusiness } = useQuery({
    queryKey: ["business", business?.id],
    queryFn: () => businessAPI.get().then(r => r.data),
    enabled: !!business?.id,
  });
  const botStatus = businessData?.botStatus;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await businessAPI.update({
        name: settings.botName,
        telegramBotToken: settings.telegramBotToken || undefined,
        telegramBotUsername: settings.telegramBotUsername || undefined
      });
      await refreshBusiness();
      refetchBusiness();
      toast({
        title: "Bot connected",
        description: "Webhook registered. Your bot is ready to receive messages."
      });
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message || "Failed to save settings.";
      toast({
        variant: "destructive",
        title: "Error",
        description: msg
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Bot Settings</h1>
        <p className="text-muted-foreground">Customize how your AI assistant responds to customers</p>
      </div>

      {/* Basic Settings */}
      <Card className="p-6">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4" /> Basic Configuration
        </h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="telegramBotToken" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Telegram Bot Token
            </Label>
            <Input
              id="telegramBotToken"
              value={settings.telegramBotToken}
              onChange={(e) => handleChange("telegramBotToken", e.target.value)}
              placeholder="1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ"
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Your secret HTTP API token from @BotFather
            </p>
          </div>
          <div>
            <Label htmlFor="telegramBotUsername" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Telegram Bot Username
            </Label>
            <Input
              id="telegramBotUsername"
              value={settings.telegramBotUsername}
              onChange={(e) => handleChange("telegramBotUsername", e.target.value)}
              placeholder="MyAwesomeBot"
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Example: YourBusinessBot (without the @ symbol)
            </p>
          </div>

          {botStatus != null && (
            <div className="rounded-lg border border-border p-3 space-y-2">
              <p className="text-sm font-medium text-foreground">Bot status</p>
              <div className="flex items-center gap-2">
                {botStatus.healthy ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm">{botStatus.healthy ? "Connected" : "Not connected"}</span>
              </div>
              {botStatus.webhookUrl && (
                <p className="text-xs text-muted-foreground truncate" title={botStatus.webhookUrl}>
                  Webhook: {botStatus.webhookUrl}
                </p>
              )}
              {botStatus.lastError && (
                <p className="text-xs text-destructive">Error: {botStatus.lastError}</p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="botName">Bot Name</Label>
            <Input
              id="botName"
              value={settings.botName}
              onChange={(e) => handleChange("botName", e.target.value)}
              placeholder="Enter bot name"
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This is how customers will see your assistant identified
            </p>
          </div>

          <div>
            <Label htmlFor="greetingMessage">Greeting Message</Label>
            <Input
              id="greetingMessage"
              value={settings.greetingMessage}
              onChange={(e) => handleChange("greetingMessage", e.target.value)}
              placeholder="Enter greeting message"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="businessHours">Business Hours</Label>
            <Input
              id="businessHours"
              value={settings.businessHours}
              onChange={(e) => handleChange("businessHours", e.target.value)}
              placeholder="e.g., Mon-Fri: 9 AM - 6 PM"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="language">Language</Label>
            <select
              id="language"
              value={settings.language}
              onChange={(e) => handleChange("language", e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
            >
              <option value="auto-detect">Auto-detect (Recommended)</option>
              <option value="english">English</option>
              <option value="french">French</option>
              <option value="italian">Italian</option>
              <option value="arabic">Arabic</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Auto-detect will reply in the customer's language automatically
            </p>
          </div>
        </div>
      </Card>

      {/* Messages */}
      <Card className="p-6">
        <h2 className="font-semibold text-foreground mb-4">Automatic Responses</h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="autoReplyOutOfHours">Out of Hours Message</Label>
            <textarea
              id="autoReplyOutOfHours"
              value={settings.autoReplyOutOfHours}
              onChange={(e) => handleChange("autoReplyOutOfHours", e.target.value)}
              placeholder="Message to send when you're closed"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="bookingConfirmation">Booking Confirmation Message</Label>
            <textarea
              id="bookingConfirmation"
              value={settings.bookingConfirmation}
              onChange={(e) => handleChange("bookingConfirmation", e.target.value)}
              placeholder="Message to confirm bookings"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
              rows={3}
            />
          </div>
        </div>
      </Card>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-blue-900 mb-1">Smart Responses</h3>
          <p className="text-sm text-blue-800">
            Your bot uses your knowledge base to answer questions about your services. These settings control fallback messages when the bot isn't sure about something.
          </p>
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={isSaving}
        size="lg"
        className="gap-2"
      >
        <Save className="w-4 h-4" />
        {isSaving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
