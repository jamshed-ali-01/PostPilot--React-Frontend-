import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles, ArrowRight, ShieldCheck, LogIn } from "lucide-react";
import { LandingNavbar } from "@/components/layout/LandingNavbar";
import { LandingFooter } from "@/components/layout/LandingFooter";
import { useAuth } from "@/contexts/AuthContext";
import confetti from "canvas-confetti";

const Success = () => {
    const { refreshUser, user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const type = searchParams.get("type");
    const isNewReg = type === "new_reg";

    useEffect(() => {
        // Refresh user data to get active subscription status
        if (user && !isNewReg) {
            refreshUser();
        }

        // Trigger confetti for a premium feel
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
    }, [refreshUser, user, isNewReg]);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <LandingNavbar />

            <main className="flex-grow flex items-center justify-center pt-24 pb-12 px-4 relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10" />

                <div className="max-w-md w-full text-center space-y-8 animate-fade-up">
                    <div className="relative inline-block">
                        <div className="w-24 h-24 rounded-3xl bg-success/10 flex items-center justify-center mx-auto ring-8 ring-success/5 animate-bounce-subtle">
                            <CheckCircle className="w-12 h-12 text-success" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-lg animate-pulse">
                            <Sparkles className="w-5 h-5 text-accent-foreground" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h1 className="font-display text-4xl font-bold text-foreground">
                            {isNewReg ? "Welcome to PostPilot!" : "Welcome Aboard!"}
                        </h1>
                        <p className="text-xl text-muted-foreground">
                            {isNewReg
                                ? "Your account and business profile have been set up successfully."
                                : "Your 14-day free trial has been activated successfully."}
                        </p>
                    </div>

                    <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 space-y-4 text-left">
                        <div className="flex items-start gap-3">
                            <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
                            <div>
                                <p className="font-medium text-foreground text-sm">Account Activated</p>
                                <p className="text-xs text-muted-foreground">Your business profile is now live and ready for AI automation.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
                            <div>
                                <p className="font-medium text-foreground text-sm">Trial Started</p>
                                <p className="text-xs text-muted-foreground">You won't be charged until your 14-day trial period ends.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            variant="accent"
                            size="xl"
                            className="w-full h-14 text-lg font-semibold group shadow-lg shadow-accent/20"
                            onClick={() => navigate(isNewReg ? "/login" : "/dashboard")}
                        >
                            {isNewReg ? "Log In to Your Account" : "Go to Dashboard"}
                            {isNewReg ? <LogIn className="w-5 h-5 ml-2" /> : <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
                        </Button>
                        <p className="text-sm text-muted-foreground">
                            {isNewReg ? "Need help? " : "Need help getting started? "}
                            <Link to="/docs" className="text-primary hover:underline font-medium">Read our guide</Link>
                        </p>
                    </div>
                </div>
            </main>

            <LandingFooter />
        </div>
    );
};

export default Success;
