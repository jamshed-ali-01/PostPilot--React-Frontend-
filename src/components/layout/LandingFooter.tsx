import { Sparkles } from "lucide-react";

export const LandingFooter = () => {
    return (
        <footer className="py-12 border-t border-border bg-card">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-accent-foreground" />
                        </div>
                        <span className="font-display font-semibold text-foreground">PostPilot</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        © 2024 PostPilot. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};
