import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";

export default function BotSettingsPage() {
  const [autoDetect, setAutoDetect] = useState(true);

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">Bot Settings</h1>

      <div className="rounded-xl bg-card border border-border shadow-card p-6 space-y-6">
        <div>
          <Label>Bot Name</Label>
          <Input className="mt-1.5" defaultValue="Assistant" />
        </div>

        <div>
          <Label>Personality</Label>
          <Select defaultValue="friendly">
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="friendly">Friendly and Professional</SelectItem>
              <SelectItem value="formal">Formal and Business-like</SelectItem>
              <SelectItem value="casual">Casual and Fun</SelectItem>
              <SelectItem value="concise">Short and Concise</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Working Hours Start</Label><Input className="mt-1.5" type="time" defaultValue="09:00" /></div>
          <div><Label>Working Hours End</Label><Input className="mt-1.5" type="time" defaultValue="21:00" /></div>
        </div>

        <div>
          <Label>Out-of-Hours Message</Label>
          <Textarea className="mt-1.5" defaultValue="Thanks for reaching out! We're currently closed. Our working hours are 9 AM - 9 PM. We'll get back to you as soon as we open!" rows={3} />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div>
            <p className="text-sm font-medium text-foreground">Auto-Detect Customer Language</p>
            <p className="text-xs text-muted-foreground">Bot will reply in the customer's language</p>
          </div>
          <Switch checked={autoDetect} onCheckedChange={setAutoDetect} />
        </div>

        <div>
          <Label>Google Maps Link</Label>
          <Input className="mt-1.5" placeholder="https://maps.google.com/..." />
        </div>

        <Button variant="hero"><Save className="w-4 h-4 mr-1" /> Save Settings</Button>
      </div>
    </div>
  );
}
