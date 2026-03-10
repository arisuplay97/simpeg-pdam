import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Payroll, Employee } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, TrendingDown, Wallet, Search } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const formatRp = (val: string | null) => {
  if (!val) return "Rp 0";
  return `Rp ${Number(val).toLocaleString('id-ID')}`;
};

export default function PayrollPage() {
  const [search, setSearch] = useState("");

  const { data: payrollData = [], isLoading } = useQuery<Payroll[]>({
    queryKey: ["/api/payroll"],
  });
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const totalGross = payrollData.reduce((s, p) => s + Number(p.totalEarnings), 0);
  const totalDeductions = payrollData.reduce((s, p) => s + Number(p.totalDeductions), 0);
  const totalNet = payrollData.reduce((s, p) => s + Number(p.netSalary), 0);

  const filtered = payrollData.filter(p => {
    const emp = employees.find(e => e.id === p.employeeId);
    return !search || emp?.fullName.toLowerCase().includes(search.toLowerCase()) || emp?.nip.toLowerCase().includes(search.toLowerCase());
  });

  const salaryDistribution = (() => {
    const ranges = [
      { name: "< 5 Jt", min: 0, max: 5000000, count: 0 },
      { name: "5-7 Jt", min: 5000000, max: 7000000, count: 0 },
      { name: "7-10 Jt", min: 7000000, max: 10000000, count: 0 },
      { name: "> 10 Jt", min: 10000000, max: Infinity, count: 0 },
    ];
    payrollData.forEach(p => {
      const net = Number(p.netSalary);
      const range = ranges.find(r => net >= r.min && net < r.max);
      if (range) range.count++;
    });
    return ranges;
  })();

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Penggajian</h1>
        <p className="text-sm text-muted-foreground mt-1">Kelola slip gaji dan komponen penggajian pegawai</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Pendapatan</p><p className="text-xl font-bold mt-1">{formatRp(String(totalGross))}</p></div>
            <div className="p-2.5 rounded-xl bg-emerald-600/10"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Potongan</p><p className="text-xl font-bold mt-1">{formatRp(String(totalDeductions))}</p></div>
            <div className="p-2.5 rounded-xl bg-red-500/10"><TrendingDown className="w-5 h-5 text-red-500" /></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Gaji Bersih</p><p className="text-xl font-bold mt-1 text-primary">{formatRp(String(totalNet))}</p></div>
            <div className="p-2.5 rounded-xl bg-sky-600/10"><Wallet className="w-5 h-5 text-sky-600" /></div>
          </div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Distribusi Gaji</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={salaryDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#0284c7" name="Pegawai" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Cari pegawai..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" data-testid="input-search-payroll" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Pegawai</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">Periode</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-3 py-3">Gaji Pokok</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-3 py-3">Tunjangan</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-3 py-3">Potongan</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-3 py-3">Gaji Bersih</th>
                  <th className="text-center text-xs font-medium text-muted-foreground px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => {
                  const emp = employees.find(e => e.id === p.employeeId);
                  const totalAllowance = Number(p.positionAllowance) + Number(p.familyAllowance) + Number(p.transportAllowance) + Number(p.mealAllowance);
                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors" data-testid={`payroll-row-${p.id}`}>
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium">{emp?.fullName || "—"}</p>
                        <p className="text-xs text-muted-foreground">{emp?.nip}</p>
                      </td>
                      <td className="px-3 py-3 text-sm">{p.period}</td>
                      <td className="px-3 py-3 text-sm text-right font-mono">{formatRp(p.basicSalary)}</td>
                      <td className="px-3 py-3 text-sm text-right font-mono text-emerald-600">{formatRp(String(totalAllowance))}</td>
                      <td className="px-3 py-3 text-sm text-right font-mono text-red-500">{formatRp(p.totalDeductions)}</td>
                      <td className="px-3 py-3 text-sm text-right font-mono font-semibold">{formatRp(p.netSalary)}</td>
                      <td className="px-3 py-3 text-center">
                        <Badge variant={p.status === "final" ? "default" : "secondary"} className="text-[10px]">{p.status}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <DollarSign className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Tidak ada data payroll</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
