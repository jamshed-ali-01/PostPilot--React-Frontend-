import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowLeft, Mail, Lock, User, Building, Check, ArrowRight, ShieldCheck, Zap, Info } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { graphqlRequest } from "@/lib/graphqlClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    businessName: "",
    fullName: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planIdFromUrl = searchParams.get("plan");

  // Fetch available plans with details
  const { data: plansData } = useQuery({
    queryKey: ["subscriptionPlans"],
    queryFn: () => graphqlRequest(`
      query GetSubscriptionPlans {
        subscriptionPlans {
          id
          name
          price
          description
          features
          isPopular
        }
      }
    `),
  });

  const plans = plansData?.subscriptionPlans || [];
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Initial plan selection from URL
  useEffect(() => {
    if (plans.length > 0 && !selectedPlanId) {
      if (planIdFromUrl) {
        setSelectedPlanId(planIdFromUrl);
      } else {
        const popular = plans.find((p: any) => p.isPopular);
        setSelectedPlanId(popular?.id || plans[0].id);
      }
    }
  }, [plans, planIdFromUrl, selectedPlanId]);

  const selectedPlan = useMemo(() => {
    return plans.find((p: any) => p.id === selectedPlanId) || null;
  }, [plans, selectedPlanId]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
    window.scrollTo(0, 0);
  };

  const handleFinalSubmit = async () => {
    if (!selectedPlan) return;
    setIsLoading(true);
    try {
      const mutation = `
        mutation InitiateRegister($input: RegisterInput!) {
          initiateRegister(input: $input) {
            stripeUrl
          }
        }
      `;

      const [firstName, ...lastNameParts] = formData.fullName.split(" ");
      const lastName = lastNameParts.join(" ");

      const data = await graphqlRequest(mutation, {
        input: {
          email: formData.email,
          password: formData.password,
          businessName: formData.businessName,
          firstName,
          lastName,
          planId: selectedPlan.id,
        }
      });

      if (data.initiateRegister.stripeUrl) {
        toast({
          title: "Registration Initiated",
          description: "Redirecting to secure checkout...",
        });
        window.location.href = data.initiateRegister.stripeUrl;
      } else {
        navigate("/login?registered=true");
      }
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Left Panel - Visual & Info */}
      <div className="hidden lg:flex flex-[0.8] bg-primary/5 items-center justify-center p-12 border-r border-border/50 sticky top-0 h-screen overflow-y-auto">
        <div className="max-w-md w-full space-y-8">
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20 mb-8">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="font-display text-4xl font-bold text-foreground leading-tight">
              Build Your <br />
              <span className="text-primary">Social Presence</span> <br />
              with AI
            </h2>
            <p className="text-lg text-muted-foreground">
              Join hundreds of businesses automating their social marketing in minutes.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            {[
              { icon: Zap, text: "AI-Generated Content", sub: "Posts tailored to your brand" },
              { icon: ShieldCheck, text: "14-Day Free Trial", sub: "Full access, no risk" },
              { icon: Info, text: "Cancel Anytime", sub: "No long-term contracts" },
            ].map((item, idx) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * idx }}
                key={idx}
                className="flex gap-4 p-4 rounded-xl hover:bg-white/50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold text-foreground">{item.text}</p>
                  <p className="text-sm text-muted-foreground">{item.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="pt-8 mt-8 border-t border-border/50">
            <div className="flex -space-x-3 mb-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-accent-soft flex items-center justify-center text-[10px] font-bold">
                  User {i}
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-background bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                +500
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Trusted by 500+ local businesses</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Steps */}
      <div className="flex-1 flex flex-col px-4 sm:px-6 lg:px-12 py-12 max-w-3xl mx-auto w-full">
        <main className="w-full max-w-xl mx-auto">
          <div className="mb-12">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>

            <div className="flex items-center gap-4 mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${step >= 1 ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground'}`}>1</div>
              <div className={`h-0.5 w-12 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${step >= 2 ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground'}`}>2</div>
            </div>

            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              {step === 1 ? "Create your account" : "Review your plan"}
            </h1>
            <p className="text-muted-foreground">
              {step === 1 ? "Start your 14-day free trial today" : "Confirm your subscription details"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleNextStep}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="businessName" placeholder="Elite Plumbing" value={formData.businessName} onChange={handleChange} className="pl-10 h-12" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="fullName" placeholder="John Smith" value={formData.fullName} onChange={handleChange} className="pl-10 h-12" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="email" type="email" placeholder="john@company.com" value={formData.email} onChange={handleChange} className="pl-10 h-12" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} className="pl-10 h-12" required minLength={8} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Must be at least 8 characters</p>
                  </div>
                </div>

                <Button type="submit" className="w-full h-14 text-lg font-semibold shadow-lg shadow-primary/20 group">
                  Continue to Plan selection
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.form>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Plan Selector Slider/List */}
                <div className="space-y-4">
                  <Label className="text-lg font-bold">Select Your Package</Label>
                  <div className="grid grid-cols-1 gap-4">
                    {plans.map((plan: any) => (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`cursor-pointer p-4 rounded-2xl border-2 transition-all relative overflow-hidden ${selectedPlanId === plan.id ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-card'}`}
                      >
                        <div className="flex justify-between items-center relative z-10">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-lg">{plan.name} Package</p>
                              {plan.isPopular && <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full uppercase">Most Popular</span>}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">{plan.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-xl">£{plan.price}</p>
                            <p className="text-[10px] text-muted-foreground">/mo after trial</p>
                          </div>
                        </div>
                        {selectedPlanId === plan.id && (
                          <motion.div layoutId="plan-active" className="absolute inset-0 bg-primary/5 -z-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary Card */}
                <Card className="border-primary/20 shadow-xl shadow-primary/5">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-border pb-4">
                      <div>
                        <h3 className="font-bold text-lg">{selectedPlan?.name} Plan Subscription</h3>
                        <p className="text-sm text-muted-foreground">14-day full feature free trial</p>
                      </div>
                      <p className="font-bold text-xl text-primary">FREE</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-bold text-foreground">What's included in {selectedPlan?.name} Plan:</p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedPlan?.features.slice(0, 6).map((f: string, i: number) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Check className="w-3.5 h-3.5 text-success" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-primary/5 rounded-xl p-4 flex justify-between items-center border border-primary/10">
                      <div className="space-y-0.5">
                        <p className="font-bold text-sm">Due Today</p>
                        <p className="text-[10px] text-muted-foreground">Start trial, pay later</p>
                      </div>
                      <p className="text-2xl font-black text-primary">£0.00</p>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(1)} className="h-14 px-6 flex-shrink-0">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <Button onClick={handleFinalSubmit} disabled={isLoading} className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20">
                    {isLoading ? "Redirecting..." : `Confirm & Start 14-Day Free Trial`}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Sign in</Link>
          </p>
        </main>
      </div>
    </div>
  );
};

export default Register;
