"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChefHat, Heart, Eye } from "lucide-react";

export default function LandingPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleLogin = async (role: "hugo" | "yuge" | "visitor") => {
    setLoading(role);
    try {
      await login(role);
      router.push("/menu");
    } catch {
      setLoading(null);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-orange-50 to-background px-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center text-center"
      >
        <motion.div
          className="mb-6 text-7xl"
          animate={{ rotate: [0, -5, 5, -3, 0] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
        >
          🍜
        </motion.div>

        <h1 className="text-5xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            YuGo
          </span>{" "}
          Eats
        </h1>

        <p className="mt-3 text-lg text-muted-foreground">
          Made with love, served with joy
        </p>

        <div className="relative mt-8 flex gap-4 text-3xl">
          {["🥟", "🍚", "🥢", "🍵", "🥡"].map((emoji, i) => (
            <motion.span
              key={emoji}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="inline-block"
              whileHover={{ scale: 1.3, rotate: 15 }}
            >
              {emoji}
            </motion.span>
          ))}
        </div>
      </motion.div>

      {/* Login Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-12 flex w-full max-w-sm flex-col gap-3"
      >
        <Button
          size="lg"
          className="h-14 rounded-2xl text-base bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-0"
          onClick={() => handleLogin("yuge")}
          disabled={loading !== null}
        >
          <Heart className="mr-2" size={20} />
          {loading === "yuge" ? "Loading..." : "Enter as Yuge"}
        </Button>

        <Button
          size="lg"
          className="h-14 rounded-2xl text-base bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0"
          onClick={() => handleLogin("hugo")}
          disabled={loading !== null}
        >
          <ChefHat className="mr-2" size={20} />
          {loading === "hugo" ? "Loading..." : "Enter as Hugo"}
        </Button>

        <Button
          size="lg"
          variant="outline"
          className="h-14 rounded-2xl text-base"
          onClick={() => handleLogin("visitor")}
          disabled={loading !== null}
        >
          <Eye className="mr-2" size={20} />
          {loading === "visitor" ? "Loading..." : "Just Browsing"}
        </Button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-10 text-xs text-muted-foreground"
      >
        A personal kitchen, just for you
      </motion.p>
    </div>
  );
}
