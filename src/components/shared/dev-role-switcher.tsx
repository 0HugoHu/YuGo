"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { ChefHat, Heart, Eye, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export function DevRoleSwitcher() {
  const { role, switchRole, isDevMode } = useAuth();

  if (!isDevMode) return null;

  const roles = [
    { key: "hugo" as const, label: "Hugo", icon: <ChefHat size={14} />, color: "bg-primary" },
    { key: "yuge" as const, label: "Yuge", icon: <Heart size={14} />, color: "bg-primary" },
    { key: "visitor" as const, label: "Visitor", icon: <Eye size={14} />, color: "bg-primary" },
  ];

  return (
    <div className="fixed top-2 right-2 z-[100] flex gap-1 rounded-full bg-black/80 p-1 backdrop-blur text-white shadow-lg">
      {roles.map((r) => (
        <button
          key={r.key}
          onClick={() => switchRole(r.key)}
          className={cn(
            "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
            role === r.key ? `${r.color} text-white` : "text-white/60 hover:text-white"
          )}
        >
          {r.icon}
          {r.label}
        </button>
      ))}
      <Link
        href="/admin"
        className="flex items-center rounded-full px-2 py-1 text-white/60 hover:text-white transition-colors"
      >
        <Shield size={14} />
      </Link>
    </div>
  );
}
