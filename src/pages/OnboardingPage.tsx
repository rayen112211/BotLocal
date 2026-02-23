import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageSquare, CheckCircle2, Loader, AlertCircle, Building2, Utensils, ShoppingBag, Home, Stethoscope, Hammer, Sparkles, Smile, ShieldCheck, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

const INDUSTRIES = [
  { id: "Restaurant", icon: Utensils, label: "Restaurant & Cafe", color: "bg-orange-500" },
  { id: "Service", icon: Hammer, label: "Home Services", color: "bg-blue-500" },
  { id: "Retail", icon: ShoppingBag, label: "Retail & E-commerce", color: "bg-purple-500" },
  { id: "Real Estate", icon: Home, label: "Real Estate", color: "bg-green-500" },
  { id: "Health", icon: Stethoscope, label: "Health & Wellness", color: "bg-pink-500" },
  { id: "Other", icon: Building2, label: "Other Business", color: "bg-slate-500" },
];

const PERSONALITIES = [
  { id: "Friendly", icon: Smile, label: "Friendly & Warm", description: "Approachable and kind, treats every customer like a friend." },
  { id: "Professional", icon: ShieldCheck, label: "Professional & Precise", description: "Efficient, formal, and strictly focused on business information." },
  { id: "Creative", icon: Sparkles, label: "Creative & Energetic", description: "Fun, uses emojis, and adds a bit of flair to every reply." },
  { id: "Concise", icon: Zap, label: "Fast & Concise", description: "Short, direct-to-the-point answers for busy customers." },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [personality, setPersonality] = useState("Professional");
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { business, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleScanWebsite = async () => {
    if (!website) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a website URL" });
      return;
    }

    setIsScanning(true);

    try {
      const res = await fetch("http://localhost:3001/api/scanner/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ url: website, businessId: business?.id })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to scan website");
      }

      toast({
        title: "Website scanned!",
        description: "Your bot now knows about your business."
      });

      setStep(3);
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

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`http://localhost:3001/api/business/${business?.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          industry,
          botPersonality: personality,
          websiteUrl: website
        })
      });

      if (!res.ok) throw new Error("Failed to save profile");

      setStep(4);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const steps = [
    { number: 1, title: "Industry" },
    { number: 2, title: "Training" },
    { number: 3, title: "Personality" },
    { number: 4, title: "Go Live" }
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-sm">
            <Zap className="w-8 h-8 text-primary fill-primary/20" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Create Your AI Employee</h1>
          <p className="text-muted-foreground mt-1">Let's build a bot that sounds just like your best staff member.</p>
        </div>

        {/* Progress Bar */}
        <div className="flex justify-center gap-8 mb-10 overflow-hidden">
          {steps.map((s) => (
            <div key={s.number} className="flex flex-col items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step === s.number
                  ? "bg-primary text-primary-foreground shadow-lg scale-110 ring-4 ring-primary/20"
                  : step > s.number
                    ? "bg-primary text-primary-foreground shadow-none"
                    : "bg-white border-2 border-muted text-muted-foreground"
                  }`}
              >
                {step > s.number ? <CheckCircle2 className="w-6 h-6" /> : s.number}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${step >= s.number ? 'text-primary' : 'text-muted-foreground'}`}>
                {s.title}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Industry */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-center mb-2">What is your business type?</h2>
            <p className="text-muted-foreground text-center mb-8">This helps us tailor your bot's behavior and knowledge.</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {INDUSTRIES.map((ind) => (
                <button
                  key={ind.id}
                  onClick={() => { setIndustry(ind.id); setStep(2); }}
                  className={`flex flex-col items-center justify-center gap-4 p-6 rounded-2xl border-2 transition-all duration-300 active:scale-95 ${industry === ind.id
                    ? 'border-primary bg-primary/5 ring-4 ring-primary/10 shadow-md'
                    : 'border-white bg-white hover:border-primary/30 hover:shadow-lg shadow-sm'
                    }`}
                >
                  <div className={`w-12 h-12 rounded-xl ${ind.color} text-white flex items-center justify-center shadow-inner`}>
                    <ind.icon className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-sm text-foreground">{ind.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Website Scan */}
        {step === 2 && (
          <Card className="p-8 border-none shadow-xl rounded-3xl animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="bg-primary/5 w-fit px-4 py-1 rounded-full text-primary font-bold text-xs mb-4 mx-auto border border-primary/10">
              AI TRAINING
            </div>
            <h2 className="text-2xl font-bold text-center mb-4">Train your bot with your website</h2>
            <p className="text-muted-foreground text-center mb-8">
              Paste your URL and we'll automatically learn your services, hours, and prices.
            </p>

            <div className="space-y-6">
              <div className="relative">
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="h-14 px-6 rounded-2xl text-lg shadow-sm border-2 focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900 leading-relaxed font-medium">
                  Our "Magic Scanner" will read your site in seconds to build your bot's brain.
                </p>
              </div>

              <div className="flex gap-4">
                <Button variant="ghost" size="lg" className="flex-1 rounded-xl" onClick={() => setStep(1)}>Back</Button>
                <Button
                  className="flex-[2] h-12 rounded-xl text-lg font-bold shadow-lg shadow-primary/20"
                  size="lg"
                  onClick={handleScanWebsite}
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <>
                      <Loader className="w-5 h-5 mr-3 animate-spin" /> Training AI...
                    </>
                  ) : (
                    "Start Magic Scan"
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Step 3: Personality */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 font-sans">
            <h2 className="text-2xl font-bold text-center mb-2">Configure Bot Personality</h2>
            <p className="text-muted-foreground text-center mb-8">Choose how you want your AI assistant to sound.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {PERSONALITIES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPersonality(p.id)}
                  className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all duration-300 ${personality === p.id
                    ? 'border-primary bg-primary/5 ring-4 ring-primary/10 shadow-md'
                    : 'border-white bg-white hover:border-primary/30 hover:shadow-lg shadow-sm'
                    }`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-white border flex items-center justify-center text-primary shadow-sm ${personality === p.id ? 'border-primary/50' : 'border-muted'}`}>
                    <p.icon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-foreground">{p.label}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{p.description}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <Button variant="ghost" size="lg" className="flex-1 rounded-xl" onClick={() => setStep(2)}>Back</Button>
              <Button
                className="flex-[2] h-12 rounded-xl text-lg font-bold shadow-lg shadow-primary/20"
                size="lg"
                onClick={handleUpdateProfile}
                disabled={isSaving}
              >
                {isSaving ? <Loader className="w-5 h-5 animate-spin" /> : "Complete Setup"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <Card className="p-10 text-center border-none shadow-2xl rounded-[3rem] animate-in zoom-in duration-700">
            <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6 relative">
              <CheckCircle2 className="w-12 h-12 text-success" />
              <div className="absolute inset-0 rounded-full border-4 border-success animate-ping opacity-20"></div>
            </div>

            <h2 className="text-3xl font-black text-foreground mb-3 uppercase tracking-tight">Your Bot is Born!</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Your AI assistant is now configured for your **{industry}** business. It's currently monitoring your WhatsApp number.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="bg-[#f3f4f6] p-5 rounded-3xl border-2 border-white shadow-inner">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Status</p>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                  <p className="font-bold text-foreground">Active</p>
                </div>
              </div>
              <div className="bg-[#f3f4f6] p-5 rounded-3xl border-2 border-white shadow-inner">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Knowledge</p>
                <p className="font-bold text-foreground">Scanned</p>
              </div>
            </div>

            <Button
              className="w-full h-14 rounded-2xl text-xl font-black shadow-xl shadow-primary/30 active:scale-[0.98] transition-all"
              size="lg"
              onClick={() => navigate("/dashboard")}
            >
              Enter Dashboard
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
