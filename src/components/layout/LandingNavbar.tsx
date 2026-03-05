import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const LandingNavbar = () => {
    const { user } = useAuth();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-sm">
                            <Sparkles className="w-5 h-5 text-accent-foreground" />
                        </div>
                        <span className="font-display font-semibold text-lg text-foreground">PostPilot</span>
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                            Pricing
                        </Link>
                        <div className="flex items-center gap-3">
                            {user ? (
                                <Link to="/dashboard">
                                    <Button variant="accent" size="sm">Dashboard</Button>
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login">
                                        <Button variant="ghost" size="sm">Sign In</Button>
                                    </Link>
                                    <Link to="/register">
                                        <Button variant="accent" size="sm">Get Started</Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};
