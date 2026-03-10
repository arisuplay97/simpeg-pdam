import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Attendance, Employee } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarCheck, Clock, AlertTriangle, UserCheck, UserX,
  Search, LogIn, LogOut as LogOutIcon, Timer
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const statusColors: Record<string, string> = {
  hadir: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  izin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  sakit: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  cuti: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  alpha: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "dinas luar": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
};

export default function AttendancePage() {
  const today = new Date().toISOString().split('T')[0];
  const [dateFilter, setDateFilter] = useState(today);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const { data: allAttendance = [], isLoading } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const checkInMutation = useMutation({
    mutationFn: async (employeeId: number) => {
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      let late = 0;
      if (now.getHours() > 7 || (now.getHours() === 7 && now.getMinutes() > 30)) {
        late = (now.getHours() - 7) * 60 + now.getMinutes() - 30;
      }
      const res = await apiRequest("POST", "/api/attendance", {
        employeeId,
        date: today,
        checkIn: time,
        status: "hadir",
        lateMinutes: late,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({ title: "Check-in berhasil" });
    },
  });

  const getEmpName = (id: number) => employees.find(e => e.id === id)?.fullName || "—";
  const getEmpNip = (id: number) => employees.find(e => e.id === id)?.nip || "—";

  const todayRecords = allAttendance.filter(a => a.date === today);
  const hadirCount = todayRecords.filter(a => a.status === "hadir").length;
  const lateCount = todayRecords.filter(a => (a.lateMinutes ?? 0) > 0).length;
  const absentCount = todayRecords.filter(a => ["izin", "sakit", "alpha", "cuti"].includes(a.status)).length;

  const filtered = allAttendance.filter(a => {
    const emp = employees.find(e => e.id === a.employeeId);
    const matchSearch = !search || (emp?.fullName.toLowerCase().includes(search.toLowerCase()) || emp?.nip.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    const matchDate = !dateFilter || a.date === dateFilter;
    return matchSearch && matchStatus && matchDate;
  });

  const weeklyTrend = (() => {
    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('id-ID', { weekday: 'short' });
      days[key] = allAttendance.filter(a => a.date === d.toISOString().split('T')[0] && (a.lateMinutes ?? 0) > 0).length;
    }
    return Object.entries(days).map(([name, terlambat]) => ({ name, terlambat }));
  })();

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-1 sm:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Absensi</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor kehadiran pegawai PDAM</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-emerald-600/10"><UserCheck className="w-5 h-5 text-emerald-600" /></div>
          <div><p className="text-xs text-muted-foreground font-medium">Hadir Hari Ini</p><p className="text-xl font-bold">{hadirCount}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10"><AlertTriangle className="w-5 h-5 text-amber-500" /></div>
          <div><p className="text-xs text-muted-foreground font-medium">Terlambat</p><p className="text-xl font-bold">{lateCount}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-red-500/10"><UserX className="w-5 h-5 text-red-500" /></div>
          <div><p className="text-xs text-muted-foreground font-medium">Tidak Hadir</p><p className="text-xl font-bold">{absentCount}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-sky-600/10"><Clock className="w-5 h-5 text-sky-600" /></div>
          <div><p className="text-xs text-muted-foreground font-medium">Total Record</p><p className="text-xl font-bold">{todayRecords.length}</p></div>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Tren Keterlambatan (7 Hari)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="terlambat" fill="#f59e0b" name="Terlambat" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <LogIn className="w-4 h-4 text-primary" />
              Quick Check-In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">Pilih pegawai untuk check-in hari ini</p>
            <div className="space-y-2 max-h-[180px] overflow-auto">
              {employees.slice(0, 5).map(emp => {
                const hasChecked = todayRecords.some(a => a.employeeId === emp.id);
                return (
                  <div key={emp.id} className="flex items-center justify-between p-2 rounded-lg border border-border/50" data-testid={`checkin-${emp.id}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-semibold text-primary">{emp.fullName.charAt(0)}</span>
                      </div>
                      <p className="text-xs font-medium truncate">{emp.fullName}</p>
                    </div>
                    {hasChecked ? (
                      <Badge variant="outline" className="text-[10px]">Sudah</Badge>
                    ) : (
                      <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => checkInMutation.mutate(emp.id)} data-testid={`btn-checkin-${emp.id}`}>
                        Check-in
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Cari pegawai..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" data-testid="input-search-attendance" />
            </div>
            <div className="flex gap-2">
              <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-[160px]" data-testid="input-date-filter" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]" data-testid="select-attendance-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="hadir">Hadir</SelectItem>
                  <SelectItem value="izin">Izin</SelectItem>
                  <SelectItem value="sakit">Sakit</SelectItem>
                  <SelectItem value="cuti">Cuti</SelectItem>
                  <SelectItem value="alpha">Alpha</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Pegawai</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">Tanggal</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">Check-In</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">Check-Out</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">Terlambat</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.slice(0, 50).map((a) => (
                  <tr key={a.id} className="hover:bg-muted/30 transition-colors" data-testid={`att-row-${a.id}`}>
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium">{getEmpName(a.employeeId)}</p>
                      <p className="text-xs text-muted-foreground">{getEmpNip(a.employeeId)}</p>
                    </td>
                    <td className="px-3 py-3 text-sm">{new Date(a.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="px-3 py-3">
                      {a.checkIn ? <span className="text-sm flex items-center gap-1"><LogIn className="w-3.5 h-3.5 text-emerald-500" />{a.checkIn}</span> : <span className="text-sm text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      {a.checkOut ? <span className="text-sm flex items-center gap-1"><LogOutIcon className="w-3.5 h-3.5 text-sky-500" />{a.checkOut}</span> : <span className="text-sm text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      {(a.lateMinutes ?? 0) > 0 ? <span className="text-sm text-amber-600 flex items-center gap-1"><Timer className="w-3.5 h-3.5" />{a.lateMinutes} mnt</span> : <span className="text-sm text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${statusColors[a.status] || statusColors.hadir}`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <CalendarCheck className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Tidak ada data absensi</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
