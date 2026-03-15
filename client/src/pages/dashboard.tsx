import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Employee, Notification, Attendance, LeaveRequest, RankPromotion, SalaryIncrease } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import {
  Users, UserCheck, UserCog, Clock, AlertTriangle, FileText,
  Calendar, DollarSign, TrendingUp, Bell, Activity, Shield, ArrowRight, Timer,
  Search, Filter, GraduationCap, Building2, CheckCircle2
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
    <Card className="relative overflow-hidden glass-panel border-0 ring-1 ring-border/50 hover:ring-border transition-all duration-300 hover:shadow-md" data-testid={`stat-${title.toLowerCase().replace(/\s/g, '-')}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5 min-w-0 pr-4">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">{title}</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
            {subtitle && <p className="text-[11px] text-muted-foreground/80 truncate">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-2xl ${color} shadow-sm shrink-0`}>
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

  const isAdminOrDir = user?.role === "admin" || user?.role === "direktur" || user?.role === "superadmin";

  const { data: alerts } = useQuery<{ promote: Employee[], salary: Employee[] }>({
    queryKey: ["/api/dashboard/alerts"],
    enabled: !!isAdminOrDir,
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

  const RETIREMENT_AGE = 56;
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

  const [activeTab, setActiveTab] = useState("Semua");

  if (statsLoading) {
    return (
      <div className="flex flex-col xl:flex-row gap-6 h-full">
        <div className="flex-1 space-y-6">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        </div>
        <div className="hidden xl:block w-[380px]">
          <Skeleton className="h-[600px] rounded-2xl" />
        </div>
      </div>
    );
  }

  const approvalItems = [
    ...pendingLeave.map(lr => ({
      id: `leave-${lr.id}`,
      type: 'Cuti / Izin',
      name: employees.find(e => e.id === lr.employeeId)?.fullName || '—',
      date: new Date(lr.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      unit: employees.find(e => e.id === lr.employeeId)?.structuralPosition || '—',
      status: 'PENDING',
      link: '/leave'
    })),
    ...awaitingDirApproval.map(rp => ({
      id: `promo-${rp.id}`,
      type: 'Kenaikan Pangkat',
      name: employees.find(e => e.id === rp.employeeId)?.fullName || '—',
      date: rp.createdAt ? new Date(rp.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '—',
      unit: employees.find(e => e.id === rp.employeeId)?.structuralPosition || '—',
      status: 'PENDING',
      link: '/rank-promotions'
    })),
    ...pendingSalaryIncreases.map(si => ({
      id: `salary-${si.id}`,
      type: 'Kenaikan Gaji',
      name: employees.find(e => e.id === si.employeeId)?.fullName || '—',
      date: si.createdAt ? new Date(si.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '—',
      unit: employees.find(e => e.id === si.employeeId)?.structuralPosition || '—',
      status: 'PENDING',
      link: '/salary-increases'
    }))
  ];

  const filteredApprovals = approvalItems.filter(item => {
    if (activeTab === "Semua") return true;
    if (activeTab === "Cuti/Izin" && item.type === "Cuti / Izin") return true;
    if (activeTab === "Mutasi" && item.type === "Kenaikan Pangkat") return true;
    if (activeTab === "Gaji" && item.type === "Kenaikan Gaji") return true;
    return false;
  });

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* Left Main Area */}
      <div className="flex-1 space-y-6 min-w-0 pb-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground" data-testid="text-page-title">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Ringkasan informasi operasional SDM PDAM Tirta Ardhia Rinjani</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Total Pegawai" value={stats?.totalEmployees || 0} icon={Users} color="bg-gradient-to-br from-blue-600 to-blue-500" subtitle="Seluruh pegawai terdaftar" />
          <StatCard title="Formasi Terisi" value={stats?.activeEmployees || 0} icon={UserCheck} color="bg-gradient-to-br from-emerald-600 to-emerald-500" subtitle="Pegawai berstatus aktif" />
          <StatCard title="Mendekati Pensiun" value={endingIn1Year.length} icon={Timer} color="bg-gradient-to-br from-orange-500 to-orange-400" subtitle="Dalam 1 tahun ke depan" />
          
          <StatCard title="Payroll Bulan Ini" value={`Rp 2.4M`} icon={DollarSign} color="bg-gradient-to-br from-indigo-600 to-indigo-500" subtitle="Estimasi total" />
          <StatCard title="Rerata Kinerja" value={`8.4 / 10`} icon={Activity} color="bg-gradient-to-br from-cyan-600 to-cyan-500" subtitle="Bulan lalu" />
          <StatCard title="Approval Pending" value={approvalItems.length} icon={AlertTriangle} color="bg-gradient-to-br from-rose-600 to-rose-500" subtitle="Membutuhkan tindakan" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="glass-panel border-0 ring-1 ring-border/50 shadow-sm rounded-[1.25rem]">
            <CardHeader className="pb-2 border-b border-border/50">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Sebaran Pegawai
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 pb-2">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={deptDistribution} cx="50%" cy="50%" outerRadius={85} innerRadius={55} dataKey="value" paddingAngle={2}>
                    {deptDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-panel border-0 ring-1 ring-border/50 shadow-sm rounded-[1.25rem]">
            <CardHeader className="pb-2 border-b border-border/50">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                Kehadiran 7 Hari Terakhir
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 pb-2">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={attendanceByDay} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'hsl(var(--muted) / 0.4)' }} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="hadir" fill="#0ea5e9" name="Hadir" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="izin" fill="#f59e0b" name="Izin" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="alpha" fill="#ef4444" name="Alpha" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="glass-panel border-0 ring-1 ring-border/50 shadow-sm rounded-[1.25rem]">
            <CardHeader className="pb-2 border-b border-border/50">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-purple-500" />
                  Notifikasi Teratas
                </div>
                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-0 dark:bg-purple-900/30 dark:text-purple-300">Terbaru</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {notifications.slice(0, 4).map((notif) => (
                  <div key={notif.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors cursor-pointer group shadow-sm bg-slate-50/50 dark:bg-slate-900/50">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      notif.type === "warning" ? "bg-amber-100/80 text-amber-600" :
                      notif.type === "leave" ? "bg-blue-100/80 text-blue-600" :
                      "bg-sky-100/80 text-sky-600"
                    }`}>
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 pr-2">
                      <p className="text-sm font-semibold leading-tight text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">{notif.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{notif.message}</p>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">Tidak ada notifikasi baru</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-0 ring-1 ring-border/50 shadow-sm rounded-[1.25rem]">
            <CardHeader className="pb-2 border-b border-border/50">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-500" />
                Insight SDM
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-3.5 rounded-xl bg-gradient-to-r from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10 border border-orange-100 dark:border-orange-900/30">
                  <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0 shadow-sm border border-orange-200 dark:border-orange-800">
                    <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-orange-800 dark:text-orange-300">Peringkat Kedisiplinan</p>
                    <p className="text-[11px] font-medium text-orange-600/80 dark:text-orange-400/80">3 pegawai mendekati batas terlambat</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0 shadow-sm border border-blue-200 dark:border-blue-800">
                    <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-800 dark:text-blue-300">Pelatihan Aktif</p>
                    <p className="text-[11px] font-medium text-blue-600/80 dark:text-blue-400/80">14 pegawai sedang dalam masa sertifikasi</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Panel: Approval Center */}
      {isAdminOrDir && (
        <div className="w-full xl:w-[360px] shrink-0">
          <div className="sticky top-20 bg-background/40 backdrop-blur-xl border border-border/50 rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
            <h2 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Approval Center
            </h2>
            
            <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-hide -mx-1 px-1">
              {["Semua", "Cuti/Izin", "Lembur", "Mutasi", "Gaji"].map(t => (
                <button 
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-3.5 py-1.5 text-[11px] font-semibold rounded-full whitespace-nowrap transition-all duration-200 ${
                    activeTab === t 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105' 
                    : 'bg-white dark:bg-slate-800 border text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="relative mb-5">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
              <input 
                type="text" 
                placeholder="Cari pengajuan..." 
                className="w-full pl-9 pr-9 py-2.5 text-[13px] rounded-xl border bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" 
              />
              <Filter className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 cursor-pointer hover:text-foreground" />
            </div>

            <div className="space-y-3 pt-1">
              {filteredApprovals.length === 0 ? (
                <div className="p-8 text-center bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Tidak ada pengajuan</p>
                  <p className="text-xs text-slate-400 mt-1">Semua beres untuk "{activeTab}"</p>
                </div>
              ) : filteredApprovals.slice(0, 5).map(item => (
                <div key={item.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-3 items-center min-w-0 pr-2">
                      <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                        {item.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 transition-colors">{item.name}</p>
                        <p className="text-[10px] font-medium text-slate-500 truncate">{item.unit.replace(/_/g, ' ').toUpperCase()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/60">
                    <div>
                      <Badge variant="outline" className="text-[9px] font-bold tracking-wider bg-orange-50/50 text-orange-600 border-orange-200 px-1.5 py-0 uppercase mb-0.5">{item.type}</Badge>
                      <p className="text-[10px] text-muted-foreground">{item.date}</p>
                    </div>
                    <Link href={item.link}>
                      <button className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white dark:bg-blue-900/30 dark:hover:bg-blue-600 dark:text-blue-400 dark:hover:text-white rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 shadow-sm">
                        Review
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredApprovals.length > 5 && (
              <button className="w-full mt-4 py-2.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-white dark:bg-slate-900 rounded-xl border border-blue-100 dark:border-blue-900/50 shadow-[0_2px_10px_-3px_rgba(59,130,246,0.1)] hover:shadow-[0_4px_12px_-2px_rgba(59,130,246,0.15)] transition-all active:scale-[0.98]">
                Lihat Semua ({filteredApprovals.length})
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
