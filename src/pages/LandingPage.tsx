import { MessageSquare, Zap, Globe, Star, Calendar, BarChart3, ArrowRight, CheckCircle2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link } from "react-router-dom";

const features = [
  { icon: MessageSquare, title: "AI Telegram Chatbot", desc: "Answer customer questions 24/7 with AI that knows your business inside out." },
  { icon: Globe, title: "Multilingual Support", desc: "Auto-detect and reply in Arabic, French, Italian, English — and more." },
  { icon: Calendar, title: "Smart Bookings", desc: "Let customers book appointments directly through Telegram chat." },
  { icon: Star, title: "Review Automation", desc: "Automatically request Google reviews after completed appointments." },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Track messages, bookings, and customer satisfaction in real time." },
  { icon: Zap, title: "5-Minute Setup", desc: "Scan your website, connect Telegram, and your bot is ready to go." },
];

const plans = [
  { name: "Starter", price: 29, features: ["500 messages/month", "1 language", "Basic analytics", "Telegram chatbot", "Booking management"], popular: false },
  { name: "Pro", price: 59, features: ["Unlimited messages", "All languages", "Full analytics", "Review automation", "Priority support"], popular: true },
  { name: "Agency", price: 99, features: ["Everything in Pro", "Multiple locations", "White-label option", "API access", "Dedicated support"], popular: false },
];

const categories = ["Restaurants", "Barbershops", "Clinics", "Gyms", "Lawyers", "Real Estate"];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">BotLocal</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#categories" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Industries</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild><Link to="/login">Log in</Link></Button>
            <Button variant="hero" asChild><Link to="/signup">Start Free Trial</Link></Button>
          </div>

          <button className="md:hidden text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-card border-t border-border p-4 space-y-3">
            <a href="#features" className="block text-sm text-muted-foreground py-2">Features</a>
            <a href="#pricing" className="block text-sm text-muted-foreground py-2">Pricing</a>
            <a href="#categories" className="block text-sm text-muted-foreground py-2">Industries</a>
            <div className="pt-2 space-y-2">
              <Button variant="ghost" className="w-full" asChild><Link to="/login">Log in</Link></Button>
              <Button variant="hero" className="w-full" asChild><Link to="/signup">Start Free Trial</Link></Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-up">
            <Zap className="w-4 h-4" />
            Set up in under 5 minutes
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            Your Business on{" "}
            <span className="text-gradient">Telegram</span>,{" "}
            <br className="hidden sm:block" />
            Powered by AI
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            Create an AI chatbot that answers questions, books appointments, and
            collects reviews — all through Telegram. No coding required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <Button variant="hero" size="lg" className="text-base px-8 py-6" asChild>
              <Link to="/signup">
                Start Free 14-Day Trial
                <ArrowRight className="w-5 h-5 ml-1" />
              </Link>
            </Button>
            <Button variant="hero-outline" size="lg" className="text-base px-8 py-6">
              Watch Demo
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground animate-fade-up" style={{ animationDelay: "0.4s" }}>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-success" /> No credit card</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-success" /> 14-day free trial</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-success" /> Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="py-12 px-4 border-y border-border/50 bg-card/50">
        <div className="container mx-auto">
          <p className="text-center text-sm text-muted-foreground mb-6">Trusted by local businesses worldwide</p>
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((cat) => (
              <span key={cat} className="px-5 py-2 rounded-full border border-border bg-card text-sm font-medium text-muted-foreground">
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Everything your business needs</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From automated customer support to appointment booking — all in one platform.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="group p-6 rounded-xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all duration-300">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 bg-card/50">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Simple, transparent pricing</h2>
            <p className="text-lg text-muted-foreground">Start free for 14 days. No credit card required.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-8 rounded-xl border transition-all duration-300 ${plan.popular
                    ? "bg-card border-primary shadow-elevated scale-[1.02]"
                    : "bg-card border-border shadow-card hover:shadow-card-hover"
                  }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full gradient-primary text-primary-foreground text-xs font-semibold">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.popular ? "hero" : "outline"}
                  className="w-full"
                  asChild
                >
                  <Link to="/signup">Start Free Trial</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ready to put your business on Telegram?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of local businesses using AI to serve their customers better.
          </p>
          <Button variant="hero" size="lg" className="text-base px-8 py-6" asChild>
            <Link to="/signup">
              Get Started for Free
              <ArrowRight className="w-5 h-5 ml-1" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">BotLocal</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 BotLocal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
