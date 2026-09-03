"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownCheckItem, DropdownContent, DropdownTrigger } from "@/components/ui/dropdown";

export function ThemeToggle() {
  const { theme, setTheme, resolved } = useTheme();

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Change theme">
          {resolved === "dark" ? <Moon /> : <Sun />}
        </Button>
      </DropdownTrigger>
      <DropdownContent className="min-w-40">
        <DropdownCheckItem checked={theme === "light"} onSelect={() => setTheme("light")}>
          <Sun /> Light
        </DropdownCheckItem>
        <DropdownCheckItem checked={theme === "dark"} onSelect={() => setTheme("dark")}>
          <Moon /> Dark
        </DropdownCheckItem>
        <DropdownCheckItem checked={theme === "system"} onSelect={() => setTheme("system")}>
          <Monitor /> System
        </DropdownCheckItem>
      </DropdownContent>
    </Dropdown>
  );
}
