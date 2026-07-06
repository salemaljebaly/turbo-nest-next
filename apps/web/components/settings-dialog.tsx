"use client";

import * as React from "react";
import { Monitor, Moon, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { messages, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type SettingsTab = "general" | "account";
type Theme = "light" | "dark" | "system";

function applyTheme(theme: Theme) {
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  window.localStorage.setItem("theme", theme);
}

export function SettingsDialog({
  locale,
  open,
  defaultTab,
  user,
  onOpenChange,
}: {
  locale: Locale;
  open: boolean;
  defaultTab?: SettingsTab;
  user: { name: string; email: string };
  onOpenChange: (open: boolean) => void;
}) {
  const t = messages[locale];
  const [activeTab, setActiveTab] = React.useState<SettingsTab>(
    defaultTab ?? "general",
  );
  const [theme, setTheme] = React.useState<Theme>("system");

  React.useEffect(() => {
    if (open && defaultTab) setActiveTab(defaultTab);
  }, [defaultTab, open]);

  React.useEffect(() => {
    const saved = window.localStorage.getItem("theme") as Theme | null;
    if (saved) {
      setTheme(saved);
      applyTheme(saved);
    }
  }, []);

  if (!open) return null;

  const themeOptions = [
    { value: "system" as const, label: t.system, icon: Monitor },
    { value: "light" as const, label: t.light, icon: Sun },
    { value: "dark" as const, label: t.dark, icon: Moon },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background/70 p-4 backdrop-blur-sm">
      <div className="mx-auto mt-16 grid max-w-2xl border bg-card shadow-xl md:grid-cols-[12rem_1fr]">
        <div className="border-b p-3 md:border-r md:border-b-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">{t.settings}</h2>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Close settings"
              onClick={() => onOpenChange(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
          <div className="grid gap-1">
            {(["general", "account"] as const).map((tab) => (
              <Button
                key={tab}
                variant="ghost"
                className={cn(
                  "justify-start",
                  activeTab === tab && "bg-muted text-foreground",
                )}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "general" ? t.settings : t.account}
              </Button>
            ))}
          </div>
        </div>
        <div className="min-h-72 p-5">
          {activeTab === "general" ? (
            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">{t.appearance}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Choose the dashboard theme for this browser.
                </p>
              </div>
              <div className="flex gap-2">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.value}
                      variant={theme === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setTheme(option.value);
                        applyTheme(option.value);
                      }}
                    >
                      <Icon className="size-3.5" />
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">{t.account}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Session details from Better Auth.
                </p>
              </div>
              <dl className="grid gap-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-medium">{user.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="font-medium">{user.email}</dd>
                </div>
              </dl>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
