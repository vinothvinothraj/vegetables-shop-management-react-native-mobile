"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { Button } from "@/components/ui";
import { useApp } from "@/context/app-context";

export function ThemeToggle() {
  const { theme, setTheme } = useApp();

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
      <span className="hidden sm:inline">{theme === "dark" ? "Light" : "Dark"}</span>
    </Button>
  );
}
