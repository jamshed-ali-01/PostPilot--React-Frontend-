import { useBrandTheme } from "@/contexts/ThemeContext";
import { Palette } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeSwitcherProps {
  className?: string;
  variant?: "toggle" | "icon";
}

export function ThemeSwitcher({ className, variant = "toggle" }: ThemeSwitcherProps) {
  const { brandTheme, toggleBrandTheme } = useBrandTheme();

  if (variant === "icon") {
    return (
      <button
        onClick={toggleBrandTheme}
        className={cn(
          "flex items-center justify-center w-9 h-9 rounded-lg transition-all",
          "hover:bg-secondary text-muted-foreground hover:text-foreground",
          className
        )}
        aria-label="Toggle theme"
        title={`Switch to ${brandTheme === "default" ? "Firstclass" : "Default"} theme`}
      >
        <Palette className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="text-sm font-medium text-foreground">Theme</span>
      <button
        onClick={toggleBrandTheme}
        className={cn(
          "relative w-20 h-9 rounded-full transition-all p-1",
          brandTheme === "default" 
            ? "bg-accent" 
            : "bg-primary"
        )}
        aria-label="Toggle theme"
      >
        <div
          className={cn(
            "absolute top-1 w-7 h-7 rounded-full bg-white shadow-sm transition-all duration-300 flex items-center justify-center",
            brandTheme === "default" ? "left-1" : "left-12"
          )}
        >
          <span className="text-[10px] font-bold text-foreground">
            {brandTheme === "default" ? "DF" : "FC"}
          </span>
        </div>
      </button>
    </div>
  );
}
