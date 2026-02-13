"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { BottomNav } from "@/components/shared/bottom-nav";
import { PageTransition } from "@/components/shared/page-transition";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Trophy, Star, Calendar, ChefHat, UtensilsCrossed, Heart, BarChart3, ThumbsDown } from "lucide-react";

interface SpiceTrendPoint {
  orderId: number;
  userId: number;
  userName: string;
  date: string;
  avgSpice: number;
}

interface Stats {
  totalOrders: number;
  completedOrders: number;
  totalDishesServed: number;
  averageRating: number;
  topDishes: Array<{ dishId: number; dishName: string | null; totalOrdered: number }>;
  bestRated: { dishId: number; dishName: string | null; avgRating: number; reviewCount: number } | null;
  worstRated: { dishId: number; dishName: string | null; avgRating: number; reviewCount: number } | null;
  daysTogether: number;
  categoryStats: Array<{ category: string | null; count: number }>;
  ordersByDay: Array<{ day: string; count: number }>;
  hugoFavorite: { dishName: string | null; totalOrdered: number } | null;
  yugeFavorite: { dishName: string | null; totalOrdered: number } | null;
  spiceTrend: SpiceTrendPoint[];
}

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type TimeRange = "1M" | "3M" | "6M" | "All";

function SpiceTrendChart({ data }: { data: SpiceTrendPoint[] }) {
  const [range, setRange] = useState<TimeRange>("All");

  const filtered = useMemo(() => {
    if (range === "All") return data;
    const now = Date.now();
    const months = range === "1M" ? 1 : range === "3M" ? 3 : 6;
    const cutoff = now - months * 30 * 24 * 60 * 60 * 1000;
    return data.filter((d) => new Date(d.date).getTime() >= cutoff);
  }, [data, range]);

  const hugoPoints = filtered.filter((d) => d.userId === 1);
  const yugePoints = filtered.filter((d) => d.userId === 2);

  if (filtered.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-4">
        No spice data for this period
      </div>
    );
  }

  const width = 320;
  const height = 100;
  const padX = 30;
  const padY = 14;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const allDates = filtered.map((d) => new Date(d.date).getTime());
  const minDate = Math.min(...allDates);
  const maxDate = Math.max(...allDates);
  const dateRange = maxDate - minDate || 1;

  const toX = (date: string) => padX + ((new Date(date).getTime() - minDate) / dateRange) * chartW;
  const toY = (spice: number) => padY + chartH - (spice / 5) * chartH;

  const makePath = (points: SpiceTrendPoint[]) => {
    if (points.length === 0) return "";
    return points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(p.date).toFixed(1)} ${toY(p.avgSpice).toFixed(1)}`)
      .join(" ");
  };

  const ranges: TimeRange[] = ["1M", "3M", "6M", "All"];

  return (
    <div>
      <div className="flex gap-1 mb-3">
        {ranges.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
              range === r
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {[0, 1, 2, 3, 4, 5].map((v) => (
          <g key={v}>
            <line
              x1={padX} y1={toY(v)} x2={width - padX} y2={toY(v)}
              stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.5}
            />
            <text x={padX - 4} y={toY(v) + 3} textAnchor="end" fontSize={8} fill="currentColor" opacity={0.4}>
              {v}
            </text>
          </g>
        ))}

        {hugoPoints.length > 1 && (
          <path d={makePath(hugoPoints)} fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        )}
        {hugoPoints.map((p) => (
          <circle key={`h-${p.orderId}`} cx={toX(p.date)} cy={toY(p.avgSpice)} r={3} fill="var(--primary)" />
        ))}

        {yugePoints.length > 1 && (
          <path d={makePath(yugePoints)} fill="none" stroke="var(--primary)" strokeOpacity={0.45} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        )}
        {yugePoints.map((p) => (
          <circle key={`y-${p.orderId}`} cx={toX(p.date)} cy={toY(p.avgSpice)} r={3} fill="var(--primary)" fillOpacity={0.45} />
        ))}
      </svg>

      <div className="flex justify-center gap-4 mt-1.5">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded bg-primary" />
          <span className="text-[10px] text-muted-foreground">Hugo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded bg-primary/45" />
          <span className="text-[10px] text-muted-foreground">Yuge</span>
        </div>
      </div>
    </div>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-dvh pb-20 px-4 pt-6">
          <h1 className="text-2xl font-bold">Stats</h1>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
          <BottomNav />
        </div>
      </PageTransition>
    );
  }

  if (!stats) {
    return (
      <PageTransition>
        <div className="min-h-dvh pb-20 px-4 pt-6">
          <h1 className="text-2xl font-bold">Stats</h1>
          <p className="mt-8 text-center text-muted-foreground">Failed to load stats</p>
          <BottomNav />
        </div>
      </PageTransition>
    );
  }

  const maxOrdered = stats.topDishes[0]?.totalOrdered || 1;

  return (
    <PageTransition>
      <div className="min-h-dvh pb-20">
        <div className="px-4 pt-6">
          <h1 className="text-2xl font-bold">Stats</h1>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5 px-4">
          {/* Days Together */}
          <Card className="rounded-xl border-0 shadow-sm">
            <CardContent className="flex items-center gap-2.5 px-3 py-2">
              <Calendar size={16} className="text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-lg font-bold leading-tight">{stats.daysTogether}</p>
                <p className="text-[10px] text-muted-foreground">Days Together</p>
              </div>
            </CardContent>
          </Card>

          {/* Avg Rating */}
          <Card className="rounded-xl border-0 shadow-sm">
            <CardContent className="flex items-center gap-2.5 px-3 py-2">
              <Star size={16} className="text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-lg font-bold leading-tight">{stats.averageRating}/5</p>
                <p className="text-[10px] text-muted-foreground">Avg Rating</p>
              </div>
            </CardContent>
          </Card>

          {/* Total Orders */}
          <Card className="rounded-xl border-0 shadow-sm">
            <CardContent className="flex items-center gap-2.5 px-3 py-2">
              <UtensilsCrossed size={16} className="text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-lg font-bold leading-tight">{stats.totalOrders}</p>
                <p className="text-[10px] text-muted-foreground">Total Orders</p>
              </div>
            </CardContent>
          </Card>

          {/* Dishes Served */}
          <Card className="rounded-xl border-0 shadow-sm">
            <CardContent className="flex items-center gap-2.5 px-3 py-2">
              <ChefHat size={16} className="text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-lg font-bold leading-tight">{stats.totalDishesServed}</p>
                <p className="text-[10px] text-muted-foreground">Dishes Served</p>
              </div>
            </CardContent>
          </Card>

          {/* Hugo's Favorite */}
          <Card className="rounded-xl border-0 shadow-sm">
            <CardContent className="flex items-center gap-2.5 px-3 py-2">
              <ChefHat size={16} className="text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight truncate">
                  {stats.hugoFavorite?.dishName || "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Hugo&apos;s Fave{stats.hugoFavorite ? ` · ${stats.hugoFavorite.totalOrdered}x` : ""}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Yuge's Favorite */}
          <Card className="rounded-xl border-0 shadow-sm">
            <CardContent className="flex items-center gap-2.5 px-3 py-2">
              <Heart size={16} className="text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight truncate">
                  {stats.yugeFavorite?.dishName || "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Yuge&apos;s Fave{stats.yugeFavorite ? ` · ${stats.yugeFavorite.totalOrdered}x` : ""}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Best Rated */}
          {stats.bestRated && (
            <Card className="rounded-xl border-0 shadow-sm">
              <CardContent className="flex items-center gap-2.5 px-3 py-2">
                <Trophy size={16} className="text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight truncate">
                    {stats.bestRated.dishName}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Best · {stats.bestRated.avgRating.toFixed(1)}/5
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Worst Rated */}
          {stats.worstRated && (
            <Card className="rounded-xl border-0 shadow-sm">
              <CardContent className="flex items-center gap-2.5 px-3 py-2">
                <ThumbsDown size={16} className="text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight truncate">
                    {stats.worstRated.dishName}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Worst · {stats.worstRated.avgRating.toFixed(1)}/5
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Spice Tolerance Trend */}
        {stats.spiceTrend.length > 0 && (
          <div className="mt-5 px-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold mb-2">
              <Flame size={15} className="text-primary" />
              Spice Trend
            </h2>
            <Card className="rounded-xl border-0 shadow-sm">
              <CardContent className="py-3 px-3">
                <SpiceTrendChart data={stats.spiceTrend} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Top Dishes Leaderboard */}
        {stats.topDishes.length > 0 && (
          <div className="mt-5 px-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold mb-2">
              <Trophy size={15} className="text-primary" />
              Dish Leaderboard
            </h2>
            <Card className="rounded-xl border-0 shadow-sm">
              <CardContent className="py-3 px-3 space-y-2">
                {stats.topDishes.map((dish, i) => (
                  <motion.div
                    key={dish.dishId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <span className="w-5 text-center text-sm font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{dish.dishName}</span>
                        <span className="text-xs text-muted-foreground">{dish.totalOrdered}x</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(dish.totalOrdered / maxOrdered) * 100}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                          className="h-full rounded-full bg-primary/30"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Orders by Day */}
        {stats.ordersByDay.length > 0 && (
          <div className="mt-5 px-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold mb-2">
              <BarChart3 size={15} className="text-primary" />
              Orders by Day
            </h2>
            <Card className="rounded-xl border-0 shadow-sm">
              <CardContent className="py-3 px-3">
                <div className="flex items-end gap-2" style={{ height: 80 }}>
                  {dayNames.map((day, i) => {
                    const dayData = stats.ordersByDay.find((d) => d.day === i.toString());
                    const count = dayData?.count || 0;
                    const maxCount = Math.max(...stats.ordersByDay.map((d) => d.count), 1);
                    const barHeight = Math.max((count / maxCount) * 56, count > 0 ? 4 : 0);
                    return (
                      <div key={day} className="flex flex-1 flex-col items-center justify-end gap-1 h-full">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: barHeight }}
                          transition={{ duration: 0.6, delay: i * 0.05 }}
                          className="w-full rounded-t bg-primary/25"
                          style={{ minWidth: 4 }}
                        />
                        <span className="text-[10px] text-muted-foreground">{day}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="h-4" />
        <BottomNav />
      </div>
    </PageTransition>
  );
}
