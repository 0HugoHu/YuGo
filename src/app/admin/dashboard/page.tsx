"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import NextImage from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ChefHat, ClipboardList, UtensilsCrossed, Users, Settings, LogOut,
  Plus, Pencil, Trash2, Image as ImageIcon, RefreshCw, Copy, Eye, EyeOff,
  Clock, CheckCircle2, XCircle, Star,
} from "lucide-react";

// ============ TYPES ============

interface Dish {
  id: number; name: string; description: string; price: number; category: string;
  imageUrl: string | null; thumbnailUrl: string | null; spiceLevel: number;
  prepTime: number; isAvailable: boolean;
}

interface OrderItem {
  id: number; dishName: string | null; quantity: number;
  priceAtOrder: number; specialNotes?: string | null;
}

interface Order {
  id: number; userId: number; status: string; totalPrice: number;
  notes?: string | null; createdAt: string; completedAt?: string | null;
  items: OrderItem[];
}

interface User {
  id: number; name: string; role: string; fingerprint: string | null;
  deviceName: string | null; isWhitelisted: boolean; createdAt: string;
}

const CATEGORIES = ["Mains", "Appetizers", "Soups", "Sides", "Noodles", "Desserts", "Drinks"];
const STATUS_OPTIONS = ["pending", "cooking", "ready", "completed", "cancelled"];

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  cooking: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  ready: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400",
  completed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  cancelled: "bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400",
};

// ============ ORDERS TAB ============

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active");

  const fetchOrders = useCallback(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => { setOrders(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (orderId: number, status: string) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Order #${orderId} → ${status}`);
      fetchOrders();
    } catch { toast.error("Failed to update order"); }
  };

  const deleteOrder = async (orderId: number) => {
    if (!confirm(`Delete order #${orderId}? This will also remove its reviews.`)) return;
    try {
      const res = await fetch(`/api/orders?id=${orderId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success(`Order #${orderId} deleted`);
      fetchOrders();
    } catch { toast.error("Failed to delete order"); }
  };

  const activeStatuses = ["pending", "cooking", "ready"];
  const filtered = filter === "active"
    ? orders.filter((o) => activeStatuses.includes(o.status))
    : filter === "all" ? orders
    : orders.filter((o) => o.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="all">All Orders</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={fetchOrders}>
          <RefreshCw size={14} className="mr-1" /> Refresh
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No orders found</p>
      ) : (
        filtered.map((order) => (
          <Card key={order.id} className="rounded-xl">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Order #{order.id}</span>
                <Badge className={`${statusColors[order.status] || ""} border-0`}>
                  {order.status}
                </Badge>
              </div>
              <div className="space-y-1 text-sm">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.quantity}x {item.dishName || "Unknown"}</span>
                    {item.specialNotes && (
                      <span className="text-xs text-muted-foreground italic">{item.specialNotes}</span>
                    )}
                  </div>
                ))}
              </div>
              {order.notes && (
                <p className="mt-2 text-xs text-muted-foreground italic">Note: {order.notes}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(order.createdAt).toLocaleString()}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {order.status === "pending" && (
                  <>
                    <Button size="sm" className="flex-1 rounded-full" onClick={() => updateStatus(order.id, "cooking")}>
                      <ChefHat size={14} className="mr-1" /> Start Cooking
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full text-muted-foreground" onClick={() => updateStatus(order.id, "cancelled")}>
                      <XCircle size={14} className="mr-1" /> Cancel
                    </Button>
                  </>
                )}
                {order.status === "cooking" && (
                  <>
                    <Button size="sm" className="flex-1 rounded-full" onClick={() => updateStatus(order.id, "ready")}>
                      <Clock size={14} className="mr-1" /> Mark Ready
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full text-muted-foreground" onClick={() => updateStatus(order.id, "cancelled")}>
                      <XCircle size={14} className="mr-1" /> Cancel
                    </Button>
                  </>
                )}
                {order.status === "ready" && (
                  <Button size="sm" className="flex-1 rounded-full" onClick={() => updateStatus(order.id, "completed")}>
                    <CheckCircle2 size={14} className="mr-1" /> Complete
                  </Button>
                )}
                <Button size="sm" variant="outline" className="rounded-full text-destructive" onClick={() => deleteOrder(order.id)}>
                  <Trash2 size={14} className="mr-1" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

// ============ REVIEWS TAB ============

interface Review {
  id: number; userId: number; dishId: number; orderId: number | null;
  rating: number; comment: string | null; createdAt: string;
  userName: string | null; dishName: string | null;
}

function ReviewsTab() {
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(() => {
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((data) => { setReviewsList(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const deleteReview = async (id: number) => {
    if (!confirm("Delete this review?")) return;
    try {
      const res = await fetch(`/api/reviews?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Review deleted");
      fetchReviews();
    } catch { toast.error("Failed to delete review"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{reviewsList.length} review{reviewsList.length !== 1 ? "s" : ""}</p>
        <Button variant="outline" size="sm" onClick={fetchReviews}>
          <RefreshCw size={14} className="mr-1" /> Refresh
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Loading...</p>
      ) : reviewsList.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No reviews yet</p>
      ) : (
        reviewsList.map((review) => (
          <Card key={review.id} className="rounded-xl">
            <CardContent className="py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{review.dishName || "Unknown dish"}</p>
                    <div className="flex">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} size={12} className={i < review.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    by {review.userName || "Unknown"} {review.orderId ? `· Order #${review.orderId}` : ""}
                  </p>
                  {review.comment && (
                    <p className="text-sm mt-1">{review.comment}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(review.createdAt).toLocaleString()}
                  </p>
                </div>
                <button onClick={() => deleteReview(review.id)} className="rounded-full border p-2 text-destructive hover:bg-muted shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

// ============ DISHES TAB ============

function DishForm({ dish, onSave, onClose }: { dish?: Dish; onSave: () => void; onClose: () => void }) {
  const [name, setName] = useState(dish?.name || "");
  const [description, setDescription] = useState(dish?.description || "");
  const [price, setPrice] = useState(dish?.price?.toString() || "0");
  const [category, setCategory] = useState(dish?.category || "Mains");
  const [spiceLevel, setSpiceLevel] = useState(dish?.spiceLevel?.toString() || "0");
  const [prepTime, setPrepTime] = useState(dish?.prepTime?.toString() || "15");
  const [isAvailable, setIsAvailable] = useState(dish?.isAvailable ?? true);
  const [imageUrl, setImageUrl] = useState(dish?.imageUrl || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(dish?.thumbnailUrl || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setImageUrl(data.imageUrl);
      setThumbnailUrl(data.thumbnailUrl);
      toast.success("Image uploaded!");
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const body = {
        ...(dish ? { id: dish.id } : {}),
        name: name.trim(), description: description.trim(),
        price: parseFloat(price) || 0, category,
        spiceLevel: parseInt(spiceLevel) || 0, prepTime: parseInt(prepTime) || 15,
        isAvailable, imageUrl: imageUrl || null, thumbnailUrl: thumbnailUrl || null,
      };
      const res = await fetch("/api/dishes", {
        method: dish ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast.success(dish ? "Dish updated!" : "Dish created!");
      onSave(); onClose();
    } catch { toast.error("Failed to save dish"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea className="mt-1.5" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Spice (0-5)</Label>
          <Input className="mt-1.5" type="number" min="0" max="5" value={spiceLevel} onChange={(e) => setSpiceLevel(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Price</Label>
          <Input className="mt-1.5" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div>
          <Label>Prep Time (min)</Label>
          <Input className="mt-1.5" type="number" min="1" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
        <Label>Available</Label>
      </div>
      <div>
        <Label>Image</Label>
        <label className="mt-1.5 flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted transition-colors">
          <ImageIcon size={16} />{uploading ? "Uploading..." : imageUrl ? "Change Photo" : "Upload Photo"}
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
        {imageUrl && (
          <div className="mt-2 relative h-24 w-24 rounded-lg overflow-hidden bg-muted">
            <NextImage src={imageUrl} alt="Preview" fill className="object-cover" />
          </div>
        )}
      </div>
      <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl">
        {saving ? "Saving..." : dish ? "Update Dish" : "Add Dish"}
      </Button>
    </div>
  );
}

function DishesTab() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDish, setEditDish] = useState<Dish | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchDishes = useCallback(() => {
    fetch("/api/dishes?available=false")
      .then((r) => r.json())
      .then((data) => { setDishes(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchDishes(); }, [fetchDishes]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this dish?")) return;
    try {
      await fetch(`/api/dishes?id=${id}`, { method: "DELETE" });
      toast.success("Deleted"); fetchDishes();
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditDish(undefined); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full"><Plus size={14} className="mr-1" /> Add Dish</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editDish ? "Edit Dish" : "Add New Dish"}</DialogTitle></DialogHeader>
            <DishForm dish={editDish} onSave={fetchDishes} onClose={() => { setDialogOpen(false); setEditDish(undefined); }} />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Loading...</p>
      ) : (
        dishes.map((dish) => (
          <Card key={dish.id} className="rounded-xl">
            <CardContent className="flex items-center gap-3 py-3">
              {/* Dish thumbnail */}
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                {dish.thumbnailUrl || dish.imageUrl ? (
                  <NextImage
                    src={dish.thumbnailUrl || dish.imageUrl!}
                    alt={dish.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-lg">🍜</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{dish.name}</p>
                  {!dish.isAvailable && <Badge variant="secondary" className="text-[10px] shrink-0">Hidden</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{dish.category} &middot; Spice {dish.spiceLevel}/5 &middot; {dish.prepTime}m</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => { setEditDish(dish); setDialogOpen(true); }} className="rounded-full border p-2 hover:bg-muted">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(dish.id)} className="rounded-full border p-2 text-destructive hover:bg-muted">
                  <Trash2 size={14} />
                </button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

// ============ USERS TAB ============

function UsersTab() {
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => { setUsersList(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleWhitelist = async (user: User) => {
    try {
      await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, isWhitelisted: !user.isWhitelisted }),
      });
      toast.success(`${user.name} ${user.isWhitelisted ? "removed from" : "added to"} whitelist`);
      fetchUsers();
    } catch { toast.error("Failed"); }
  };

  const deleteUser = async (user: User) => {
    if (user.role === "hugo" || user.role === "yuge") {
      toast.error("Cannot delete Hugo or Yuge");
      return;
    }
    if (!confirm(`Delete ${user.name}?`)) return;
    try {
      await fetch(`/api/admin/users?id=${user.id}`, { method: "DELETE" });
      toast.success("Deleted"); fetchUsers();
    } catch { toast.error("Failed"); }
  };

  const clearFingerprint = async (user: User) => {
    try {
      await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, fingerprint: null }),
      });
      toast.success(`Fingerprint cleared for ${user.name}`);
      fetchUsers();
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Manage registered devices. Clear a fingerprint to allow re-registration from a new device.
      </p>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Loading...</p>
      ) : (
        usersList.map((user) => (
          <Card key={user.id} className="rounded-xl">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{user.name}</p>
                    <Badge variant={user.role === "hugo" ? "default" : user.role === "yuge" ? "secondary" : "outline"} className="text-[10px]">
                      {user.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {user.fingerprint ? `FP: ${user.fingerprint.slice(0, 12)}...` : "No fingerprint"}
                    {user.deviceName && ` · ${user.deviceName}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Joined: {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{user.isWhitelisted ? "Whitelisted" : "Blocked"}</span>
                    <Switch checked={user.isWhitelisted} onCheckedChange={() => toggleWhitelist(user)} />
                  </div>
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                {user.fingerprint && (
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => clearFingerprint(user)}>
                    Clear Fingerprint
                  </Button>
                )}
                {user.role === "visitor" && (
                  <Button variant="outline" size="sm" className="text-xs text-destructive" onClick={() => deleteUser(user)}>
                    <Trash2 size={12} className="mr-1" /> Delete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

// ============ SETTINGS TAB ============

function SettingsTab() {
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingPw, setLoadingPw] = useState(false);
  const router = useRouter();

  const fetchPassword = () => {
    fetch("/api/admin/password")
      .then((r) => r.json())
      .then((data) => setAdminPassword(data.password || ""))
      .catch(() => {});
  };

  useEffect(() => { fetchPassword(); }, []);

  const regeneratePassword = async () => {
    setLoadingPw(true);
    try {
      const res = await fetch("/api/admin/password", { method: "POST" });
      const data = await res.json();
      setAdminPassword(data.password);
      toast.success("New password generated! You will need it next time you log in.");
    } catch { toast.error("Failed"); }
    finally { setLoadingPw(false); }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(adminPassword);
    toast.success("Password copied!");
  };

  const handleLogout = () => {
    document.cookie = "admin_token=; path=/; max-age=0";
    router.replace("/admin");
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-2">Admin Password</h3>
        <div className="flex items-center gap-2">
          <Input
            type={showPassword ? "text" : "password"}
            value={adminPassword}
            readOnly
            className="font-mono"
          />
          <Button variant="outline" size="icon" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </Button>
          <Button variant="outline" size="icon" onClick={copyPassword}>
            <Copy size={16} />
          </Button>
        </div>
        <Button variant="outline" size="sm" className="mt-2" onClick={regeneratePassword} disabled={loadingPw}>
          <RefreshCw size={14} className="mr-1" /> Regenerate Password
        </Button>
      </div>

      <Separator />

      <div>
        <Button variant="outline" onClick={handleLogout} className="rounded-xl">
          <LogOut size={16} className="mr-2" /> Log Out of Admin
        </Button>
      </div>
    </div>
  );
}

// ============ MAIN DASHBOARD ============

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/check")
      .then((r) => {
        if (r.ok) setAuthed(true);
        else router.replace("/admin");
      })
      .catch(() => router.replace("/admin"))
      .finally(() => setChecking(false));
  }, [router]);

  if (checking || !authed) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* Header — pt-12 to clear dev bar overlay */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 pt-12 pb-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ChefHat size={22} className="text-primary" />
            YuGo Admin
          </h1>
          <Button variant="ghost" size="sm" onClick={() => router.push("/menu")}>
            View App
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <Tabs defaultValue="orders">
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="orders" className="gap-1 text-xs">
              <ClipboardList size={14} /> Orders
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-1 text-xs">
              <Star size={14} /> Reviews
            </TabsTrigger>
            <TabsTrigger value="dishes" className="gap-1 text-xs">
              <UtensilsCrossed size={14} /> Dishes
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1 text-xs">
              <Users size={14} /> Users
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1 text-xs">
              <Settings size={14} /> Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-4">
            <OrdersTab />
          </TabsContent>
          <TabsContent value="reviews" className="mt-4">
            <ReviewsTab />
          </TabsContent>
          <TabsContent value="dishes" className="mt-4">
            <DishesTab />
          </TabsContent>
          <TabsContent value="users" className="mt-4">
            <UsersTab />
          </TabsContent>
          <TabsContent value="settings" className="mt-4">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
