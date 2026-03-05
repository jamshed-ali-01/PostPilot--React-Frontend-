import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useState } from "react";

export const SubscriptionGate = ({ children }: { children: React.ReactNode }) => {
    const { user, isAuthenticated, refreshUser } = useAuth();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const location = useLocation();

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshUser();
        setIsRefreshing(false);
    };

    if (!user && !isAuthenticated) return null;

    // System Admins always pass
    if (user?.isSystemAdmin) {
        return <>{children}</>;
    }

    const isTrialActive = user?.business?.trialEndsAt ? new Date(user.business.trialEndsAt) > new Date() : false;

    // If there is no specific business payload or they are not active, they get blocked
    if (!user?.business?.isActive && !isTrialActive) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full text-center space-y-6 bg-card p-8 rounded-2xl border border-destructive shadow-lg">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 mx-auto flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-destructive" />
                    </div>
                    <h1 className="font-display text-2xl font-bold text-foreground">
                        Subscription Required
                    </h1>
                    <p className="text-muted-foreground">
                        Your business account is currently inactive. Please contact your system administrator or upgrade your subscription plan to regain access to the PostPilot platform.
                    </p>
                    <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-6 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            {isRefreshing ? 'Checking...' : 'Refresh Status'}
                        </button>
                        <button
                            onClick={() => window.location.href = "/pricing"}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-xl text-sm font-medium transition-colors"
                        >
                            View Pricing Plans
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
