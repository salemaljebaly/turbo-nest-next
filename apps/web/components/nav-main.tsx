"use client";

import type { DashboardSection, NavItem } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NavMain({
  activeSection,
  items,
  label,
  onSelectSection,
}: {
  activeSection: DashboardSection;
  items: NavItem[];
  label: string;
  onSelectSection: (section: DashboardSection) => void;
}) {
  return (
    <nav aria-label={label} className="space-y-1">
      {items.map((item) => (
        <Button
          key={item.id}
          type="button"
          variant="ghost"
          className={cn(
            "w-full justify-start gap-2",
            activeSection === item.id && "bg-muted text-foreground",
          )}
          onClick={() => onSelectSection(item.id)}
        >
          {item.icon}
          <span>{item.title}</span>
        </Button>
      ))}
    </nav>
  );
}
