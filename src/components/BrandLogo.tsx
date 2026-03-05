import { useBrandTheme } from "@/contexts/ThemeContext";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import firstclassLogo from "@/assets/firstclass-logo.png";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function BrandLogo({ size = "md", showText = true, className }: BrandLogoProps) {
  const { brandTheme } = useBrandTheme();
  
  const logoSizes = {
    sm: "h-8",
    md: "h-9",
    lg: "h-12",
  };

  const iconContainerSizes = {
    sm: "w-8 h-8",
    md: "w-9 h-9",
    lg: "w-12 h-12",
  };
  
  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  if (brandTheme === "firstclass") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <img 
          src={firstclassLogo} 
          alt="Firstclass Home Improvements" 
          className={cn(logoSizes[size], "w-auto object-contain")}
        />
      </div>
    );
  }

  // Default PostPilot logo
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn(
        iconContainerSizes[size],
        "rounded-xl bg-accent flex items-center justify-center shadow-sm flex-shrink-0"
      )}>
        <Sparkles className={cn(iconSizes[size], "text-accent-foreground")} />
      </div>
      {showText && (
        <div className="min-w-0">
          <span className={cn("font-display font-semibold text-sidebar-foreground block truncate", textSizes[size])}>
            PostPilot
          </span>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">
            AI Social Media
          </p>
        </div>
      )}
    </div>
  );
}
