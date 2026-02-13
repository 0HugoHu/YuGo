"use client";

import { type ReactNode } from "react";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/hooks/use-cart";
import { Toaster } from "@/components/ui/sonner";
import { DevRoleSwitcher } from "@/components/shared/dev-role-switcher";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <DevRoleSwitcher />
        {children}
        <Toaster position="top-center" richColors />
      </CartProvider>
    </AuthProvider>
  );
}
