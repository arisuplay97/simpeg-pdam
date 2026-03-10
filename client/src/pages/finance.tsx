import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { FinanceTransaction } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Wallet, TrendingUp, TrendingDown, Plus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const formatRp = (val: string | number) => `Rp ${Number(val).toLocaleString('id-ID')}`;

export default function FinancePage() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  const { data: transactions = [], isLoading } = useQuery<FinanceTransaction[]>({
    queryKey: ["/api/finance"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/finance", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance"] });
      setShowDialog(false);
      toast({ title: "Transaksi berhasil ditambahkan" });
    },
  });

  const totalIn = transactions.filter(t => t.type === "masuk").reduce((s, t) => s + Number(t.amount), 0);
  const totalOut = transactions.filter(t => t.type === "keluar").reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalIn - totalOut;

  const filtered = transactions.filter(t => typeFilter === "all" || t.type === typeFilter);

  const categoryData = (() => {
    const cats: Record<string, { masuk: number; keluar: number }> = {};
    transactions.forEach(t => {
      if (!cats[t.category]) cats[t.category] = { masuk: 0, keluar: 0 };
      if (t.type === "masuk") cats[t.category].masuk += Number(t.amount) / 1000000;
      else cats[t.category].keluar += Number(t.amount) / 1000000;
    });
    return Object.entries(cats).map(([name, data]) => ({ name: name.length > 15 ? name.slice(0, 15) + "…" : name, ...data }));
  })();

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 rounded-xl" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Keuangan</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola arus kas dan transaksi internal PDAM</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="btn-add-transaction"><Plus className="w-4 h-4" />Tambah Transaksi</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Transaksi Baru</DialogTitle></DialogHeader>
            <TransactionForm onSubmit={(d) => createMutation.mutate(d)} isPending={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Kas Masuk</p><p className="text-xl font-bold mt-1 text-emerald-600">{formatRp(totalIn)}</p></div>
            <div className="p-2.5 rounded-xl bg-emerald-600/10"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Kas Keluar</p><p className="text-xl font-bold mt-1 text-red-500">{formatRp(totalOut)}</p></div>
            <div className="p-2.5 rounded-xl bg-red-500/10"><TrendingDown className="w-5 h-5 text-red-500" /></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Saldo</p><p className={`text-xl font-bold mt-1 ${balance >= 0 ? "text-primary" : "text-red-500"}`}>{formatRp(balance)}</p></div>
            <div className="p-2.5 rounded-xl bg-sky-600/10"><Wallet className="w-5 h-5 text-sky-600" /></div>
          </div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Arus Kas per Kategori (Juta Rp)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="masuk" fill="#059669" name="Masuk" radius={[4, 4, 0, 0]} />
              <Bar dataKey="keluar" fill="#ef4444" name="Keluar" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]" data-testid="select-finance-type">
              <SelectValue placeholder="Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="masuk">Kas Masuk</SelectItem>
              <SelectItem value="keluar">Kas Keluar</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filtered.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors" data-testid={`finance-row-${t.id}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-lg ${t.type === "masuk" ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                    {t.type === "masuk" ? <ArrowUpRight className="w-4 h-4 text-emerald-600" /> : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px]">{t.category}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {t.reference && <span className="text-xs text-muted-foreground">#{t.reference}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <p className={`text-sm font-semibold font-mono ${t.type === "masuk" ? "text-emerald-600" : "text-red-500"}`}>
                    {t.type === "masuk" ? "+" : "−"} {formatRp(t.amount)}
                  </p>
                  <Badge variant={t.status === "approved" ? "default" : "secondary"} className="text-[10px]">
                    {t.status === "approved" ? "Disetujui" : "Pending"}
                  </Badge>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Wallet className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">Tidak ada transaksi</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TransactionForm({ onSubmit, isPending }: { onSubmit: (d: any) => void; isPending: boolean }) {
  const [form, setForm] = useState({ type: "keluar", category: "", amount: "", description: "", date: new Date().toISOString().split('T')[0], reference: "" });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, status: "pending" }); }} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Tipe</label>
        <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
          <SelectTrigger data-testid="select-tx-type"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="masuk">Kas Masuk</SelectItem>
            <SelectItem value="keluar">Kas Keluar</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div><label className="text-sm font-medium mb-1.5 block">Kategori</label><Input value={form.category} onChange={e => setForm({...form, category: e.target.value})} required data-testid="input-tx-category" /></div>
      <div><label className="text-sm font-medium mb-1.5 block">Jumlah (Rp)</label><Input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required data-testid="input-tx-amount" /></div>
      <div><label className="text-sm font-medium mb-1.5 block">Deskripsi</label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} required data-testid="input-tx-desc" /></div>
      <div><label className="text-sm font-medium mb-1.5 block">Tanggal</label><Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} data-testid="input-tx-date" /></div>
      <div><label className="text-sm font-medium mb-1.5 block">Referensi</label><Input value={form.reference} onChange={e => setForm({...form, reference: e.target.value})} data-testid="input-tx-ref" /></div>
      <Button type="submit" className="w-full" disabled={isPending} data-testid="btn-submit-tx">{isPending ? "Menyimpan..." : "Simpan"}</Button>
    </form>
  );
}
