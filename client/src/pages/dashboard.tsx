import { useQuery } from "@tanstack/react-query";
import type { Employee, Notification, Attendance, LeaveRequest, RankPromotion, SalaryIncrease } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import {
  Users, UserCheck, UserCog, Clock, AlertTriangle, FileText,
  Calendar, DollarSign, TrendingUp, Bell, Activity, Shield, ArrowRight, Timer
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const COLORS = ["#0284c7", "#06b6d4", "#0d9488", "#059669", "#f59e0b", "#ef4444"];

function StatCard({ title, value, icon: Icon, color, subtitle }: {
  title: string; value: string | number; icon: any; color: string; subtitle?: string;
}) {
  return (
    <Card className="relative overflow-hidden" data-testid={`stat-${title.toLowerCase().replace(/\s/g, '-')}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`p-2.5 rounded-xl ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const { data: attendance = [] } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance"],
  });

  const { data: leaveRequests = [] } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests"],
  });

  const { data: rankPromotions = [] } = useQuery<RankPromotion[]>({
    queryKey: ["/api/rank-promotions"],
  });

  const { data: salaryIncreases = [] } = useQuery<SalaryIncrease[]>({
    queryKey: ["/api/salary-increases"],
  });

  const pendingPromotions = rankPromotions.filter(rp => !["approved", "rejected"].includes(rp.status));
  const pendingSalaryIncreases = salaryIncreases.filter(si => !["approved", "rejected"].includes(si.status));
  const awaitingDirApproval = rankPromotions.filter(rp => rp.status === "approval_direktur");

  const RETIREMENT_AGE = 58;
  const getEndInfo = (emp: typeof employees[0]) => {
    if (emp.employeeType === "kontrak") {
      if (!emp.contractEndDate) return null;
      const endDate = new Date(emp.contractEndDate);
      const remainDays = Math.ceil((endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      return { endDate, remainDays, type: "kontrak" as const };
    }
    if (!emp.birthDate) return null;
    const birth = new Date(emp.birthDate);
    const endDate = new Date(birth.getFullYear() + RETIREMENT_AGE, birth.getMonth(), birth.getDate());
    const remainDays = Math.ceil((endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    return { endDate, remainDays, type: "pensiun" as const };
  };
  const endingIn1Year = employees
    .filter(emp => {
      if (emp.status !== "aktif") return false;
      const info = getEndInfo(emp);
      return info && info.remainDays > 0 && info.remainDays <= 365;
    })
    .map(emp => ({ ...emp, ...getEndInfo(emp)! }))
    .sort((a, b) => a.remainDays - b.remainDays);

  const deptDistribution = employees.reduce((acc: any[], emp) => {
    const dept = emp.departmentId || 0;
    const existing = acc.find(a => a.departmentId === dept);
    if (existing) existing.value++;
    else acc.push({ departmentId: dept, name: `Dept ${dept}`, value: 1 });
    return acc;
  }, []);

  const attendanceByDay = (() => {
    const days: Record<string, { hadir: number; izin: number; sakit: number; alpha: number }> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
      days[key] = { hadir: 0, izin: 0, sakit: 0, alpha: 0 };
    }

    attendance.forEach((a: Attendance) => {
      const d = new Date(a.date);
      const key = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
      if (days[key]) {
        if (a.status === 'hadir') days[key].hadir++;
        else if (a.status === 'izin') days[key].izin++;
        else if (a.status === 'sakit') days[key].sakit++;
        else if (a.status === 'alpha') days[key].alpha++;
      }
    });

    return Object.entries(days).map(([name, data]) => ({ name, ...data }));
  })();

  const monthlyExpenses = [
    { name: "Okt", gaji: 120, operasional: 45 },
    { name: "Nov", gaji: 122, operasional: 48 },
    { name: "Des", gaji: 125, operasional: 52 },
    { name: "Jan", gaji: 124, operasional: 42 },
    { name: "Feb", gaji: 126, operasional: 50 },
    { name: "Mar", gaji: 125, operasional: 47 },
  ];

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Ringkasan informasi PDAM Tirta Ardhia Rinjani</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Pegawai" value={stats?.totalEmployees || 0} icon={Users} color="bg-sky-600" subtitle="Seluruh pegawai" />
        <StatCard title="Pegawai Aktif" value={stats?.activeEmployees || 0} icon={UserCheck} color="bg-emerald-600" subtitle="Status aktif" />
        <StatCard title="Pegawai Kontrak" value={stats?.contractEmployees || 0} icon={UserCog} color="bg-amber-500" subtitle="Kontrak berjalan" />
        <StatCard title="Hadir Hari Ini" value={stats?.todayAttendance || 0} icon={Clock} color="bg-cyan-600" subtitle="Sudah check-in" />
        <StatCard title="Terlambat" value={stats?.lateToday || 0} icon={AlertTriangle} color="bg-orange-500" subtitle="Hari ini" />
        <StatCard title="Cuti Aktif" value={stats?.activeLeave || 0} icon={Calendar} color="bg-purple-500" subtitle="Sedang cuti" />
        <StatCard title="Menunggu Approval" value={stats?.pendingLeave || 0} icon={FileText} color="bg-rose-500" subtitle="Pengajuan cuti" />
        <StatCard title="Kenaikan Pangkat" value={pendingPromotions.length} icon={Shield} color="bg-indigo-600" subtitle="Menunggu proses" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Kehadiran 7 Hari Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={attendanceByDay} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="hadir" fill="#0284c7" name="Hadir" radius={[4, 4, 0, 0]} />
                <Bar dataKey="izin" fill="#f59e0b" name="Izin" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sakit" fill="#f97316" name="Sakit" radius={[4, 4, 0, 0]} />
                <Bar dataKey="alpha" fill="#ef4444" name="Alpha" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Distribusi Pegawai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={deptDistribution} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" paddingAngle={2}>
                  {deptDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Biaya Gaji & Operasional (Juta Rp)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyExpenses}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="gaji" stroke="#0284c7" strokeWidth={2} name="Gaji" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="operasional" stroke="#06b6d4" strokeWidth={2} name="Operasional" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              Notifikasi Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.slice(0, 5).map((notif) => (
                <div key={notif.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors" data-testid={`notification-${notif.id}`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    notif.type === "warning" ? "bg-amber-500" :
                    notif.type === "leave" ? "bg-blue-500" :
                    notif.type === "payroll" ? "bg-emerald-500" :
                    "bg-sky-500"
                  }`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">{notif.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Tidak ada notifikasi</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Pengajuan Cuti Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaveRequests.slice(0, 5).map((lr) => {
                const emp = employees.find(e => e.id === lr.employeeId);
                return (
                  <div key={lr.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50" data-testid={`leave-item-${lr.id}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-primary">{emp?.fullName?.charAt(0) || "?"}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{emp?.fullName || "—"}</p>
                        <p className="text-xs text-muted-foreground">{lr.type} · {lr.days} hari</p>
                      </div>
                    </div>
                    <Badge variant={lr.status === "approved" ? "default" : lr.status === "rejected" ? "destructive" : "secondary"} className="text-[11px] shrink-0">
                      {lr.status === "approved" ? "Disetujui" : lr.status === "rejected" ? "Ditolak" : "Menunggu"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Pegawai Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {employees.slice(-5).reverse().map((emp) => (
                <div key={emp.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50" data-testid={`emp-item-${emp.id}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-primary">{emp.fullName.charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{emp.fullName}</p>
                      <p className="text-xs text-muted-foreground">{emp.nip}</p>
                    </div>
                  </div>
                  <Badge variant={emp.status === "aktif" ? "default" : "secondary"} className="text-[11px] shrink-0">
                    {emp.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {(user?.role === "direktur" || user?.role === "admin" || user?.role === "superadmin") && endingIn1Year.length > 0 && (
        <Card data-testid="card-retirement-widget">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Pensiun & Kontrak Berakhir
              <Badge className="bg-amber-500 text-white text-[10px] ml-1">{endingIn1Year.length}</Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground">{endingIn1Year.length} pegawai akan pensiun/kontrak berakhir dalam 1 tahun ke depan</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-3">
              {endingIn1Year.slice(0, 5).map((emp) => {
                const isUrgent = emp.remainDays <= 90;
                const isKontrak = emp.type === "kontrak";
                return (
                  <div key={emp.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50" data-testid={`retirement-widget-${emp.id}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUrgent ? "bg-red-100 dark:bg-red-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
                        <Clock className={`w-4 h-4 ${isUrgent ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{emp.fullName}</p>
                        <p className="text-xs text-muted-foreground">
                          {isKontrak ? "Kontrak berakhir" : "Pensiun"}: {emp.endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={`text-[10px] ${isKontrak ? "border-purple-500/50 text-purple-600 dark:text-purple-400" : "border-amber-500/50 text-amber-600 dark:text-amber-400"}`}>
                        {isKontrak ? "Kontrak" : "Pensiun"}
                      </Badge>
                      <Badge variant={isUrgent ? "destructive" : "secondary"} className={`text-[11px] ${!isUrgent ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}`}>
                        {emp.remainDays} hari
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
            <Link href="/retirement">
              <button className="flex items-center gap-1 text-xs text-primary hover:underline" data-testid="link-view-all-retirement">
                Lihat semua daftar <ArrowRight className="w-3 h-3" />
              </button>
            </Link>
          </CardContent>
        </Card>
      )}

      {(user?.role === "direktur" || user?.role === "admin" || user?.role === "superadmin") && (awaitingDirApproval.length > 0 || pendingSalaryIncreases.length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Menunggu Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {awaitingDirApproval.map((rp) => {
                const emp = employees.find(e => e.id === rp.employeeId);
                return (
                  <div key={`rp-${rp.id}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50" data-testid={`approval-rp-${rp.id}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                        <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{emp?.fullName || "—"}</p>
                        <p className="text-xs text-muted-foreground">Kenaikan Pangkat: {rp.fromGrade} → {rp.toGrade}</p>
                      </div>
                    </div>
                    <Link href="/rank-promotions">
                      <button className="flex items-center gap-1 text-xs text-primary hover:underline" data-testid={`link-approve-rp-${rp.id}`}>
                        Proses <ArrowRight className="w-3 h-3" />
                      </button>
                    </Link>
                  </div>
                );
              })}
              {pendingSalaryIncreases.map((si) => {
                const emp = employees.find(e => e.id === si.employeeId);
                return (
                  <div key={`si-${si.id}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50" data-testid={`approval-si-${si.id}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                        <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{emp?.fullName || "—"}</p>
                        <p className="text-xs text-muted-foreground">Kenaikan Gaji: Rp {Number(si.fromSalary).toLocaleString('id-ID')} → Rp {Number(si.toSalary).toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                    <Link href="/salary-increases">
                      <button className="flex items-center gap-1 text-xs text-primary hover:underline" data-testid={`link-approve-si-${si.id}`}>
                        Proses <ArrowRight className="w-3 h-3" />
                      </button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
