"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function KitchenRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin");
  }, [router]);
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <p className="text-muted-foreground">Redirecting to admin...</p>
    </div>
  );
}
