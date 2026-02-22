import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { MessageSquare, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:3001/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to sign up");
      }

      login(data.token, data.business);
      toast({ title: "Account created!", description: "Welcome to BotLocal." });
      navigate("/onboarding");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Signup failed", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">BotLocal</span>
          </Link>

          <h1 className="text-2xl font-bold text-foreground mb-1">Create your account</h1>
          <p className="text-muted-foreground mb-8">Start your 14-day free trial</p>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Label htmlFor="name">Business Name</Label>
              <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Corp" className="mt-1.5" required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" className="mt-1.5" required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1.5" required minLength={6} />
            </div>
            <Button variant="hero" className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Creating account..." : <><>Create Account <ArrowRight className="w-4 h-4 ml-1" /></></>}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground mt-6 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Log in</Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 gradient-hero items-center justify-center p-12">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-10 h-10 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-primary-foreground mb-3">Join 2,000+ Local Businesses</h2>
          <p className="text-primary-foreground/70">Automate your WhatsApp customer service with AI.</p>
        </div>
      </div>
    </div>
  );
}
