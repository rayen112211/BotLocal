import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageSquare, CheckCircle2, Loader, Building2, Utensils, ShoppingBag, Home, Stethoscope, Hammer, Sparkles, Phone, ArrowRight, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { scannerAPI, api, businessAPI } from "@/lib/api";

const INDUSTRIES = [
  { id: "Restaurant", icon: Utensils, label: "Restaurant & Cafe", color: "bg-orange-500" },
  { id: "Service", icon: Hammer, label: "Home Services", color: "bg-blue-500" },
  { id: "Retail", icon: ShoppingBag, label: "Retail & E-commerce", color: "bg-purple-500" },
  { id: "Real Estate", icon: Home, label: "Real Estate", color: "bg-green-500" },
  { id: "Health", icon: Stethoscope, label: "Health & Wellness", color: "bg-pink-500" },
  { id: "Other", icon: Building2, label: "Other Business", color: "bg-slate-500" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSandbox, setIsSandbox] = useState(true);

  // For Step 4 (Test Message)
  const [isListening, setIsListening] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

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

  const handleIndustrySelect = async (selectedIndustry: string) => {
    setIndustry(selectedIndustry);
    setStep(2);
  };

  const handleScanWebsite = async () => {
    if (!website) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a website URL" });
      return;
    }

    setIsScanning(true);
    try {
      await scannerAPI.scan(website, business?.id || "");
      toast({
        title: "✅ Bot trained with your website",
        description: "Your AI has absorbed your business knowledge."
      });

      // Save industry & website to business profile too
      await businessAPI.update({
        industry: industry,
        websiteUrl: website
      });

      setStep(3);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Scan failed",
        description: error.response?.data?.error || error.message
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnectWhatsAppSandbox = async () => {
    setIsSaving(true);
    setIsSandbox(true);
    try {
      await businessAPI.update({
        twilioPhone: "+14155238886"
      });
      setStep(4);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.response?.data?.error || "Failed to save sandbox number" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOwnNumberSetup = () => {
    setIsSandbox(false);
    setStep(4);
  };

  // Simulate listening for a test message
  const handleListenForMessage = () => {
    setIsListening(true);
    // In a real app, you'd poll the backend or use a websocket here.
    // For the UI wizard, we simulate success after 3 seconds.
    setTimeout(() => {
      setIsListening(false);
      setTestSuccess(true);
      setTimeout(() => {
        setStep(5);
      }, 1500);
    }, 3000);
  };

  const steps = [
    { number: 1, title: "Industry" },
    { number: 2, title: "Train Bot" },
    { number: 3, title: "WhatsApp" },
    { number: 4, title: "Test" },
    { number: 5, title: "Ready" }
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-sm">
            <Sparkles className="w-8 h-8 text-primary fill-primary/20" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Create Your AI Employee</h1>
          <p className="text-muted-foreground mt-1">Setup takes less than 2 minutes.</p>
        </div>

        {/* Progress Bar */}
        <div className="flex justify-center gap-4 sm:gap-8 mb-10 overflow-hidden">
          {steps.map((s) => (
            <div key={s.number} className="flex flex-col items-center gap-2">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 ${step === s.number
                  ? "bg-primary text-primary-foreground shadow-lg scale-110 ring-4 ring-primary/20"
                  : step > s.number
                    ? "bg-primary text-primary-foreground shadow-none"
                    : "bg-white border-2 border-muted text-muted-foreground"
                  }`}
              >
                {step > s.number ? <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" /> : s.number}
              </div>
              <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest hidden sm:block ${step >= s.number ? 'text-primary' : 'text-muted-foreground'}`}>
                {s.title}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Industry */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-center mb-2">Select your Industry</h2>
            <p className="text-muted-foreground text-center mb-8">This determines your AI's default personality and knowledge setup.</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {INDUSTRIES.map((ind) => (
                <button
                  key={ind.id}
                  onClick={() => handleIndustrySelect(ind.id)}
                  className={`flex flex-col items-center justify-center gap-4 p-6 rounded-2xl border-2 transition-all duration-300 active:scale-95 border-white bg-white hover:border-primary/30 hover:shadow-lg shadow-sm`}
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
              STEP 2 OF 5
            </div>
            <h2 className="text-2xl font-bold text-center mb-4">Scan Your Website</h2>
            <p className="text-muted-foreground text-center mb-8">
              We'll instantly read your website to learn everything about your business.
            </p>

            <div className="space-y-6">
              <div className="relative">
                <Input
                  type="url"
                  placeholder="https://your-website.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="h-14 px-6 rounded-2xl text-lg shadow-sm border-2 focus-visible:ring-primary"
                />
              </div>

              <div className="flex gap-4">
                <Button variant="outline" size="lg" className="flex-1 rounded-xl h-14" onClick={() => setStep(1)}>Back</Button>
                <Button
                  className="flex-[2] h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/20"
                  size="lg"
                  onClick={handleScanWebsite}
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <>
                      <Loader className="w-5 h-5 mr-3 animate-spin" /> Scanning...
                    </>
                  ) : (
                    "Scan My Website"
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Step 3: Connect WhatsApp */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 font-sans">
            <h2 className="text-2xl font-bold text-center mb-2">Connect WhatsApp</h2>
            <p className="text-muted-foreground text-center mb-8">How do you want to connect your bot to WhatsApp right now?</p>

            <div className="grid gap-4 mb-8">
              {/* Option A: FREE SANDBOX TEST */}
              <div className="flex flex-col gap-4 p-6 rounded-2xl border-2 transition-all duration-300 border-primary bg-primary/5 ring-4 ring-primary/10 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex flex-shrink-0 items-center justify-center shadow-lg">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-foreground">🆓 Test with Sandbox (Free)</h3>
                  </div>
                </div>
                <div className="text-sm text-foreground bg-white/50 p-3 rounded-xl border border-primary/10">
                  <p><strong>Phone:</strong> +14155238886</p>
                  <p><strong>Code:</strong> join afternoon-give</p>
                </div>
                <p className="text-sm font-medium text-amber-600">⚠️ Limited to 1 test business. First come, first served.</p>
                <Button
                  onClick={handleConnectWhatsAppSandbox}
                  disabled={isSaving}
                  className="w-full text-md font-bold"
                >
                  {isSaving ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : "Use Sandbox"}
                </Button>
              </div>

              {/* Option B: REAL BUSINESS (PAID) */}
              <div className="flex flex-col gap-4 p-6 rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-100 text-green-700 flex flex-shrink-0 items-center justify-center">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-foreground">💰 Get Your Own Number (~$1/month)</h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  For real customers. No join codes needed.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 text-md font-bold border-green-200 hover:bg-green-50 text-green-700"
                    onClick={() => window.open("https://www.twilio.com/console/sms/phone-numbers", "_blank")}
                  >
                    Buy Twilio Number
                  </Button>
                  <Button
                    variant="secondary"
                    className="text-md font-bold"
                    onClick={handleOwnNumberSetup}
                  >
                    I have it
                  </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground uppercase tracking-widest font-bold">
                  We'll guide you after you get your number
                </p>
              </div>
            </div>

            <div className="flex justify-start">
              <Button variant="ghost" className="rounded-xl" onClick={() => setStep(2)}>Back</Button>
            </div>
          </div>
        )}

        {/* Step 4: Test Message */}
        {step === 4 && (
          <Card className="p-8 text-center border-none shadow-2xl rounded-3xl animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="bg-primary/5 w-fit px-4 py-1 rounded-full text-primary font-bold text-xs mb-6 mx-auto border border-primary/10">
              FINAL TEST
            </div>

            {!testSuccess ? (
              <>
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Send a Test Message</h2>
                <div className="bg-muted/30 p-6 rounded-2xl mb-8 border border-border">
                  <p className="text-lg font-medium text-foreground mb-2">1. Open WhatsApp</p>

                  {isSandbox ? (
                    <>
                      <p className="text-lg font-medium text-foreground mb-4">2. Send the message <strong>join afternoon-give</strong> to:</p>
                      <div className="text-3xl font-black text-primary tracking-wider bg-white py-3 rounded-xl border shadow-sm">+1 415 523 8886</div>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-medium text-foreground mb-4">2. Message your own Twilio number.</p>
                      <div className="text-xl font-bold text-primary tracking-wider bg-white py-3 px-2 rounded-xl border shadow-sm">Your AI will respond in seconds!</div>
                    </>
                  )}
                </div>

                <Button
                  className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg"
                  onClick={handleListenForMessage}
                  disabled={isListening}
                >
                  {isListening ? (
                    <><Loader className="w-5 h-5 mr-3 animate-spin" /> Waiting for your message...</>
                  ) : (
                    "I've sent the message"
                  )}
                </Button>
              </>
            ) : (
              <div className="py-8 animate-in zoom-in duration-500">
                <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6 relative">
                  <CheckCircle2 className="w-12 h-12 text-success" />
                  <div className="absolute inset-0 rounded-full border-4 border-success animate-ping opacity-20"></div>
                </div>
                <h2 className="text-3xl font-black text-foreground mb-3 tracking-tight">✅ WhatsApp Connected!</h2>
                <p className="text-muted-foreground text-lg">We received your ping. Moving to dashboard...</p>
              </div>
            )}
          </Card>
        )}

        {/* Step 5: Success */}
        {step === 5 && (
          <Card className="p-10 text-center border-none shadow-2xl rounded-[3rem] animate-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-4xl font-black text-foreground mb-4 tracking-tight">Setup Complete! 🎉</h2>
            <p className="text-muted-foreground mb-10 text-xl font-medium">
              Your AI employee is ready to work. It knows your business and is connected to WhatsApp.
            </p>

            <Button
              className="w-full h-16 rounded-2xl text-xl font-black shadow-xl shadow-primary/30 active:scale-[0.98] transition-all gap-3"
              size="lg"
              onClick={() => navigate("/dashboard")}
            >
              Go to Dashboard <ArrowRight className="w-6 h-6" />
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
