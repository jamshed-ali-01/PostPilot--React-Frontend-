import React, { createContext, useContext, useEffect, useState } from "react";

export type BrandTheme = "default" | "firstclass";

interface ThemeContextType {
  brandTheme: BrandTheme;
  setBrandTheme: (theme: BrandTheme) => void;
  toggleBrandTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "postflow-brand-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [brandTheme, setBrandThemeState] = useState<BrandTheme>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "firstclass" || stored === "default") {
        return stored;
      }
    }
    return "default";
  });

  useEffect(() => {
    // Apply theme class to document root
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove("theme-default", "theme-firstclass");
    
    // Add new theme class
    root.classList.add(`theme-${brandTheme}`);
    
    // Persist to localStorage
    localStorage.setItem(THEME_STORAGE_KEY, brandTheme);
  }, [brandTheme]);

  const setBrandTheme = (theme: BrandTheme) => {
    setBrandThemeState(theme);
  };

  const toggleBrandTheme = () => {
    setBrandThemeState((prev) => (prev === "default" ? "firstclass" : "default"));
  };

  return (
    <ThemeContext.Provider value={{ brandTheme, setBrandTheme, toggleBrandTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useBrandTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useBrandTheme must be used within a ThemeProvider");
  }
  return context;
}
