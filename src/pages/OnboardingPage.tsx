import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, ArrowRight, ArrowLeft, CheckCircle2, Globe, Phone, CreditCard, Building2, Loader2 } from "lucide-react";

const steps = [
  { label: "Business Info", icon: Building2 },
  { label: "Website Scanner", icon: Globe },
  { label: "WhatsApp", icon: Phone },
  { label: "Choose Plan", icon: CreditCard },
];

const categories = ["Restaurant", "Barbershop", "Clinic", "Gym", "Lawyer", "Real Estate", "Other"];
const languages = ["English", "Arabic", "French", "Italian"];

const plans = [
  { name: "Starter", price: 29, features: ["500 messages/month", "1 language", "Basic analytics"] },
  { name: "Pro", price: 59, features: ["Unlimited messages", "All languages", "Full analytics", "Review automation"] },
  { name: "Agency", price: 99, features: ["Everything in Pro", "Multiple locations", "White-label", "API access"] },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [testing, setTesting] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    businessName: "", category: "", city: "", country: "",
    primaryLanguage: "", secondaryLanguage: "", websiteUrl: "", manualInfo: "",
    twilioSid: "", twilioToken: "", whatsappNumber: "", plan: "starter",
  });

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => { setScanning(false); setScanDone(true); }, 3000);
  };

  const handleTestConnection = () => {
    setTesting(true);
    setTimeout(() => setTesting(false), 2000);
  };

  const handleFinish = () => navigate("/dashboard");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">BotLocal</span>
        </div>
      </header>

      {/* Progress */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  i < step ? "bg-success text-success-foreground" : i === step ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`hidden sm:inline text-sm ${i === step ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
                {i < steps.length - 1 && <div className={`w-8 sm:w-16 h-0.5 mx-2 ${i < step ? "bg-success" : "bg-border"}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        {step === 0 && (
          <div className="space-y-6 animate-fade-up">
            <div><h2 className="text-2xl font-bold text-foreground">Tell us about your business</h2><p className="text-muted-foreground mt-1">This helps the AI understand your business.</p></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Business Name</Label><Input className="mt-1.5" value={form.businessName} onChange={(e) => update("businessName", e.target.value)} placeholder="My Business" /></div>
              <div><Label>Category</Label><Select value={form.category} onValueChange={(v) => update("category", v)}><SelectTrigger className="mt-1.5"><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{categories.map((c) => <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>City</Label><Input className="mt-1.5" value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="New York" /></div>
              <div><Label>Country</Label><Input className="mt-1.5" value={form.country} onChange={(e) => update("country", e.target.value)} placeholder="United States" /></div>
              <div><Label>Primary Language</Label><Select value={form.primaryLanguage} onValueChange={(v) => update("primaryLanguage", v)}><SelectTrigger className="mt-1.5"><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{languages.map((l) => <SelectItem key={l} value={l.toLowerCase()}>{l}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Secondary Language (optional)</Label><Select value={form.secondaryLanguage} onValueChange={(v) => update("secondaryLanguage", v)}><SelectTrigger className="mt-1.5"><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{languages.map((l) => <SelectItem key={l} value={l.toLowerCase()}>{l}</SelectItem>)}</SelectContent></Select></div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 animate-fade-up">
            <div><h2 className="text-2xl font-bold text-foreground">Scan your website</h2><p className="text-muted-foreground mt-1">We'll extract services, prices, hours, and FAQs automatically.</p></div>
            <div>
              <Label>Website URL</Label>
              <div className="flex gap-2 mt-1.5">
                <Input value={form.websiteUrl} onChange={(e) => update("websiteUrl", e.target.value)} placeholder="https://mybusiness.com" className="flex-1" />
                <Button variant="hero" onClick={handleScan} disabled={scanning}>
                  {scanning ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning...</> : "Scan My Website"}
                </Button>
              </div>
            </div>
            {scanning && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-3 mb-3"><Loader2 className="w-5 h-5 animate-spin text-primary" /><span className="text-sm font-medium text-foreground">Scanning your website...</span></div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden"><div className="h-full gradient-primary rounded-full animate-pulse-soft" style={{ width: "60%" }} /></div>
              </div>
            )}
            {scanDone && (
              <div className="p-4 rounded-xl bg-success/5 border border-success/20 space-y-2">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-success" /><span className="font-medium text-foreground">Website scanned successfully!</span></div>
                <ul className="text-sm text-muted-foreground space-y-1 ml-7">
                  <li>✓ 12 services found</li><li>✓ Business hours extracted</li><li>✓ 8 FAQs detected</li><li>✓ Contact info saved</li>
                </ul>
              </div>
            )}
            <div className="border-t border-border pt-4">
              <p className="text-sm text-muted-foreground mb-2">Or add your business info manually:</p>
              <Textarea value={form.manualInfo} onChange={(e) => update("manualInfo", e.target.value)} placeholder="Describe your services, prices, working hours..." rows={4} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-up">
            <div><h2 className="text-2xl font-bold text-foreground">Connect WhatsApp</h2><p className="text-muted-foreground mt-1">Connect via Twilio WhatsApp Sandbox for testing.</p></div>
            <div className="p-4 rounded-xl bg-info/5 border border-info/20 text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">How to set up:</p>
              <ol className="list-decimal ml-5 space-y-1">
                <li>Go to <span className="font-medium text-primary">twilio.com</span> and create a free account</li>
                <li>Navigate to Messaging → Try it Out → WhatsApp Sandbox</li>
                <li>Copy your Account SID and Auth Token below</li>
              </ol>
            </div>
            <div className="space-y-4">
              <div><Label>Twilio Account SID</Label><Input className="mt-1.5" value={form.twilioSid} onChange={(e) => update("twilioSid", e.target.value)} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" /></div>
              <div><Label>Twilio Auth Token</Label><Input className="mt-1.5" type="password" value={form.twilioToken} onChange={(e) => update("twilioToken", e.target.value)} placeholder="Your auth token" /></div>
              <div><Label>WhatsApp Number</Label><Input className="mt-1.5" value={form.whatsappNumber} onChange={(e) => update("whatsappNumber", e.target.value)} placeholder="+1234567890" /></div>
            </div>
            <Button variant="outline" onClick={handleTestConnection} disabled={testing}>
              {testing ? <><Loader2 className="w-4 h-4 animate-spin" /> Testing...</> : "Test Connection"}
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-up">
            <div><h2 className="text-2xl font-bold text-foreground">Choose your plan</h2><p className="text-muted-foreground mt-1">Start with a 14-day free trial. Cancel anytime.</p></div>
            <div className="grid sm:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <button
                  key={plan.name}
                  onClick={() => update("plan", plan.name.toLowerCase())}
                  className={`text-left p-5 rounded-xl border-2 transition-all ${
                    form.plan === plan.name.toLowerCase() ? "border-primary bg-primary/5 shadow-card-hover" : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <h3 className="font-bold text-foreground">{plan.name}</h3>
                  <div className="flex items-baseline gap-0.5 my-2"><span className="text-2xl font-bold text-foreground">${plan.price}</span><span className="text-muted-foreground text-sm">/mo</span></div>
                  <ul className="space-y-1.5 mt-3">
                    {plan.features.map((f) => (<li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />{f}</li>))}
                  </ul>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-10 pt-6 border-t border-border">
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          {step < 3 ? (
            <Button variant="hero" onClick={() => setStep((s) => s + 1)}>
              Continue <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button variant="hero" onClick={handleFinish}>
              Start Free Trial <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
