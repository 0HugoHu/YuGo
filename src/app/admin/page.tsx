"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, ArrowLeft } from "lucide-react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  // Check if already logged in
  useEffect(() => {
    fetch("/api/admin/check")
      .then((r) => {
        if (r.ok) router.replace("/admin/dashboard");
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.replace("/admin/dashboard");
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-slate-50 to-background px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <Lock size={28} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold">YuGo Eats Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">Enter the admin password to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              autoFocus
              className="mt-1"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full rounded-xl" disabled={loading || !password}>
            {loading ? "Logging in..." : "Enter Admin Panel"}
          </Button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            onClick={() => router.push("/menu")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} />
            Back to app
          </button>
          <p className="text-xs text-muted-foreground">
            Check the server logs for the admin password on first run.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
