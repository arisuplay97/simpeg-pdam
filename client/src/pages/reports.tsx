import { useQuery } from "@tanstack/react-query";
import type { Employee, Attendance, Payroll, LeaveRequest } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Users, CalendarCheck, DollarSign, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#0284c7", "#06b6d4", "#0d9488", "#059669", "#f59e0b", "#ef4444"];
const formatRp = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;

export default function ReportsPage() {
  const { data: employees = [], isLoading: empLoading } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });
  const { data: attendance = [] } = useQuery<Attendance[]>({ queryKey: ["/api/attendance"] });
  const { data: payrollData = [] } = useQuery<Payroll[]>({ queryKey: ["/api/payroll"] });
  const { data: leaveRequests = [] } = useQuery<LeaveRequest[]>({ queryKey: ["/api/leave-requests"] });

  if (empLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 rounded-xl" /></div>;
  }

  const statusDist = [
    { name: "Hadir", value: attendance.filter(a => a.status === "hadir").length },
    { name: "Izin", value: attendance.filter(a => a.status === "izin").length },
    { name: "Sakit", value: attendance.filter(a => a.status === "sakit").length },
    { name: "Cuti", value: attendance.filter(a => a.status === "cuti").length },
    { name: "Alpha", value: attendance.filter(a => a.status === "alpha").length },
  ].filter(d => d.value > 0);

  const payrollByStatus = [
    { name: "Final", value: payrollData.filter(p => p.status === "final").length },
    { name: "Draft", value: payrollData.filter(p => p.status === "draft").length },
  ];

  const leaveByType = leaveRequests.reduce((acc: any[], lr) => {
    const existing = acc.find(a => a.name === lr.type);
    if (existing) existing.value++;
    else acc.push({ name: lr.type, value: 1 });
    return acc;
  }, []);

  const totalPayroll = payrollData.reduce((s, p) => s + Number(p.netSalary), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Laporan</h1>
        <p className="text-sm text-muted-foreground mt-1">Laporan konsolidasi data kepegawaian dan operasional</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" data-testid="tab-overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="attendance" data-testid="tab-report-attendance">Absensi</TabsTrigger>
          <TabsTrigger value="payroll" data-testid="tab-report-payroll">Gaji</TabsTrigger>
          <TabsTrigger value="leave" data-testid="tab-report-leave">Cuti</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card><CardContent className="p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-sky-600/10"><Users className="w-5 h-5 text-sky-600" /></div>
              <div><p className="text-xs text-muted-foreground font-medium">Total Pegawai</p><p className="text-xl font-bold">{employees.length}</p></div>
            </CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-emerald-600/10"><CalendarCheck className="w-5 h-5 text-emerald-600" /></div>
              <div><p className="text-xs text-muted-foreground font-medium">Record Absensi</p><p className="text-xl font-bold">{attendance.length}</p></div>
            </CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-purple-500/10"><FileText className="w-5 h-5 text-purple-500" /></div>
              <div><p className="text-xs text-muted-foreground font-medium">Pengajuan Cuti</p><p className="text-xl font-bold">{leaveRequests.length}</p></div>
            </CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10"><DollarSign className="w-5 h-5 text-amber-500" /></div>
              <div><p className="text-xs text-muted-foreground font-medium">Total Gaji</p><p className="text-lg font-bold">{formatRp(totalPayroll)}</p></div>
            </CardContent></Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Distribusi Kehadiran</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={statusDist} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" paddingAngle={2} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {statusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Pengajuan per Jenis Cuti</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={leaveByType}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="value" fill="#0284c7" name="Pengajuan" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader><CardTitle className="text-base">Laporan Absensi</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Status</th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2.5">Jumlah</th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2.5">Persentase</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {statusDist.map(s => (
                      <tr key={s.name}>
                        <td className="px-4 py-2.5 text-sm font-medium">{s.name}</td>
                        <td className="px-4 py-2.5 text-sm text-right">{s.value}</td>
                        <td className="px-4 py-2.5 text-sm text-right">{attendance.length > 0 ? ((s.value / attendance.length) * 100).toFixed(1) : 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll">
          <Card>
            <CardHeader><CardTitle className="text-base">Laporan Gaji</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
                  <p className="text-xs text-muted-foreground">Total Gaji Bersih</p>
                  <p className="text-lg font-bold text-primary mt-1">{formatRp(totalPayroll)}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
                  <p className="text-xs text-muted-foreground">Rata-rata Gaji</p>
                  <p className="text-lg font-bold mt-1">{payrollData.length > 0 ? formatRp(Math.round(totalPayroll / payrollData.length)) : "—"}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
                  <p className="text-xs text-muted-foreground">Slip Gaji</p>
                  <p className="text-lg font-bold mt-1">{payrollData.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave">
          <Card>
            <CardHeader><CardTitle className="text-base">Laporan Cuti & Izin</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
                  <p className="text-xs text-muted-foreground">Total Pengajuan</p>
                  <p className="text-lg font-bold mt-1">{leaveRequests.length}</p>
                </div>
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-center">
                  <p className="text-xs text-emerald-600">Disetujui</p>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-1">{leaveRequests.filter(l => l.status === "approved").length}</p>
                </div>
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-center">
                  <p className="text-xs text-amber-600">Menunggu</p>
                  <p className="text-lg font-bold text-amber-700 dark:text-amber-400 mt-1">{leaveRequests.filter(l => l.status === "pending").length}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Jenis</th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2.5">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {leaveByType.map(l => (
                      <tr key={l.name}>
                        <td className="px-4 py-2.5 text-sm font-medium">{l.name}</td>
                        <td className="px-4 py-2.5 text-sm text-right">{l.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
