import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { MessageSquare, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { authAPI } from "@/lib/api";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Business name is required";
    if (!email.includes("@")) newErrors.email = "Valid email is required";
    if (password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords don't match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const res = await authAPI.signup(email, password, name);
      const data = res.data;

      login(data.token, data.business);
      toast({ title: "Welcome!", description: "Your account has been created." });
      navigate("/onboarding");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Signup failed", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">BotLocal</span>
          </Link>

          <h1 className="text-2xl font-bold text-foreground mb-1">Create your account</h1>
          <p className="text-muted-foreground mb-8">Set up your AI Telegram assistant in 2 minutes</p>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Label htmlFor="name">Business Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Restaurant"
                className="mt-1.5"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.name}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.com"
                className="mt-1.5"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.email}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="mt-1.5"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.password}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="mt-1.5"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.confirmPassword}
                </p>
              )}
            </div>

            <Button variant="hero" className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Get Started"} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <p className="text-sm text-muted-foreground mt-6 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Log in</Link>
          </p>
        </div>
      </div>

      {/* Right - Decorative */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary to-primary/80 items-center justify-center p-12">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-10 h-10 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-primary-foreground mb-3">
            AI That Speaks Their Language
          </h2>
          <p className="text-primary-foreground/70 mb-8">
            Your customers message in Arabic, French, Italian, or English? No problem. BotLocal replies in the same language, automatically.
          </p>
          <ul className="text-left text-primary-foreground/80 space-y-2 text-sm">
            <li>✓ Free 30-day trial</li>
            <li>✓ No credit card needed</li>
            <li>✓ Multi-language support</li>
            <li>✓ Automatic appointment booking</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
