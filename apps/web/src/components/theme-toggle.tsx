"use client";

import { useTheme } from "next-themes";
import { AnimateIcon } from "@animate-ui/react/icons";
import { Moon } from "@/components/animate-ui/icons/moon";
import { Sun } from "@/components/animate-ui/icons/sun";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <AnimateIcon animateOnHover asChild>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Alternar tema"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      >
        <Sun className="size-4 dark:hidden" />
        <Moon className="hidden size-4 dark:block" />
      </Button>
    </AnimateIcon>
  );
}
