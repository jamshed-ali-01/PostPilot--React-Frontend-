import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, Sparkles, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { graphqlRequest } from "@/lib/graphqlClient";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const { login, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Handle success messages from registration/stripe
  useEffect(() => {
    if (searchParams.get("subscription") === "success") {
      toast({
        title: "Registration Complete!",
        description: "Your account has been created and your 14-day trial is active. Please sign in.",
      });
    } else if (searchParams.get("registered") === "true") {
      toast({
        title: "Account Created",
        description: "Please sign in to continue.",
      });
    }

    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const query = `
        mutation Login($input: LoginInput!) {
          login(input: $input) {
            access_token
            user {
              id
              email
              firstName
              lastName
              name
              isSystemAdmin
              businessId
              business {
                name
                isActive
              }
            }
          }
        }
      `;
      const data = await graphqlRequest(query, { input: { email, password } });
      login(data.login.access_token, data.login.user);

      toast({
        title: "Login successful",
        description: `Welcome back, ${data.login.user.firstName || data.login.user.name || data.login.user.email}`,
      });

      // Navigate based on user type
      if (data.login.user.isSystemAdmin) {
        window.location.href = "/dashboard"; // or a specific admin dash if exists
      } else {
        window.location.href = "/dashboard";
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 max-w-md mx-auto w-full">
        <div className="w-full">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <div className="mb-8">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="font-display font-semibold text-xl text-foreground">PostPilot</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Welcome back
            </h1>
            <p className="text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@business.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <Link to="/forgot-password" className="text-sm text-primary hover:text-primary-hover transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" variant="accent" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary font-medium hover:text-primary-hover transition-colors">
              Start your free trial
            </Link>
          </p>

          {/* Demo hint */}
          <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground text-center">
              <strong>Demo:</strong> Use any email to login. Include "staff" in email for Staff view.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:flex flex-1 bg-primary-soft items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent mx-auto mb-6 flex items-center justify-center shadow-lg">
            <Sparkles className="w-8 h-8 text-accent-foreground" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
            AI-Powered Social Media
          </h2>
          <p className="text-muted-foreground">
            Turn your team's job photos into engaging social media posts that reach local customers automatically.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
