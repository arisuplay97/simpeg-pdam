import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import type { Employee, Department, Attendance, Payroll, PerformanceReview, LeaveRequest } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Building2, GraduationCap, CreditCard, Heart, Clock, AlertTriangle } from "lucide-react";

export default function EmployeeDetail() {
  const [, params] = useRoute("/employees/:id");
  const employeeId = params?.id ? parseInt(params.id) : 0;

  const { data: employee, isLoading } = useQuery<Employee>({
    queryKey: ["/api/employees", employeeId],
    enabled: employeeId > 0,
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const { data: attendanceData = [] } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance/employee", employeeId],
    enabled: employeeId > 0,
  });

  const { data: payrollData = [] } = useQuery<Payroll[]>({
    queryKey: ["/api/payroll/employee", employeeId],
    enabled: employeeId > 0,
  });

  const { data: performanceData = [] } = useQuery<PerformanceReview[]>({
    queryKey: ["/api/performance/employee", employeeId],
    enabled: employeeId > 0,
  });

  const { data: leaveData = [] } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests/employee", employeeId],
    enabled: employeeId > 0,
  });

  if (isLoading || !employee) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const dept = departments.find(d => d.id === employee.departmentId);
  const joinDate = employee.joinDate ? new Date(employee.joinDate) : null;
  const yearsWorked = joinDate ? Math.floor((Date.now() - joinDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;

  const attendanceStats = {
    hadir: attendanceData.filter(a => a.status === 'hadir').length,
    izin: attendanceData.filter(a => a.status === 'izin').length,
    sakit: attendanceData.filter(a => a.status === 'sakit').length,
    alpha: attendanceData.filter(a => a.status === 'alpha').length,
    cuti: attendanceData.filter(a => a.status === 'cuti').length,
  };

  const formatCurrency = (val: string | null) => {
    if (!val) return "Rp 0";
    return `Rp ${Number(val).toLocaleString('id-ID')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/employees">
          <Button variant="ghost" size="icon" className="shrink-0" data-testid="btn-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-employee-name">{employee.fullName}</h1>
          <p className="text-sm text-muted-foreground">{employee.nip} · {dept?.name || "—"}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-primary">{employee.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoItem icon={Building2} label="Bagian" value={dept?.name || "—"} />
              <InfoItem icon={GraduationCap} label="Pendidikan" value={employee.education || "—"} />
              <InfoItem icon={Calendar} label="Masa Kerja" value={`${yearsWorked} tahun`} />
              <InfoItem icon={Mail} label="Email" value={employee.email || "—"} />
              <InfoItem icon={Phone} label="Telepon" value={employee.phone || "—"} />
              <InfoItem icon={MapPin} label="Alamat" value={employee.address || "—"} />
              <InfoItem icon={Heart} label="Status Nikah" value={employee.maritalStatus || "—"} />
              <InfoItem icon={CreditCard} label="Bank" value={`${employee.bankName || "—"} · ${employee.bankAccount || "—"}`} />
              <div className="flex items-center gap-2">
                <Badge variant={employee.status === "aktif" ? "default" : "secondary"}>{employee.status}</Badge>
                <Badge variant="outline">{employee.employeeType}</Badge>
                {employee.grade && <Badge variant="outline">Gol. {employee.grade}</Badge>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {employee.birthDate && <RetirementCard birthDate={employee.birthDate} joinDate={employee.joinDate} />}

      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="attendance" data-testid="tab-attendance">Absensi</TabsTrigger>
          <TabsTrigger value="payroll" data-testid="tab-payroll">Gaji</TabsTrigger>
          <TabsTrigger value="performance" data-testid="tab-performance">Kinerja</TabsTrigger>
          <TabsTrigger value="leave" data-testid="tab-leave">Cuti</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rekap Absensi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
                <StatBox label="Hadir" value={attendanceStats.hadir} color="bg-emerald-500" />
                <StatBox label="Izin" value={attendanceStats.izin} color="bg-blue-500" />
                <StatBox label="Sakit" value={attendanceStats.sakit} color="bg-amber-500" />
                <StatBox label="Cuti" value={attendanceStats.cuti} color="bg-purple-500" />
                <StatBox label="Alpha" value={attendanceStats.alpha} color="bg-red-500" />
              </div>
              <div className="space-y-2">
                {attendanceData.slice(0, 15).map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50" data-testid={`attendance-row-${a.id}`}>
                    <div>
                      <p className="text-sm font-medium">{new Date(a.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      <p className="text-xs text-muted-foreground">{a.checkIn || "—"} - {a.checkOut || "—"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {(a.lateMinutes ?? 0) > 0 && <span className="text-xs text-amber-600">Terlambat {a.lateMinutes} menit</span>}
                      <StatusBadge status={a.status} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Riwayat Gaji</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payrollData.map((p) => (
                  <div key={p.id} className="p-4 rounded-lg border border-border/50 bg-muted/20" data-testid={`payroll-row-${p.id}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold">Periode {p.period}</p>
                        <Badge variant={p.status === "final" ? "default" : "secondary"} className="text-[10px] mt-1">{p.status}</Badge>
                      </div>
                      <p className="text-lg font-bold text-primary">{formatCurrency(p.netSalary)}</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div><span className="text-muted-foreground">Gaji Pokok</span><p className="font-medium">{formatCurrency(p.basicSalary)}</p></div>
                      <div><span className="text-muted-foreground">Tunjangan</span><p className="font-medium">{formatCurrency(p.positionAllowance)}</p></div>
                      <div><span className="text-muted-foreground">Total Pendapatan</span><p className="font-medium text-emerald-600">{formatCurrency(p.totalEarnings)}</p></div>
                      <div><span className="text-muted-foreground">Total Potongan</span><p className="font-medium text-red-500">{formatCurrency(p.totalDeductions)}</p></div>
                    </div>
                  </div>
                ))}
                {payrollData.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Belum ada data gaji</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evaluasi Kinerja</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData.map((p) => (
                  <div key={p.id} className="p-4 rounded-lg border border-border/50 bg-muted/20" data-testid={`performance-row-${p.id}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-semibold">{p.period} - {p.reviewType}</p>
                        <p className="text-xs text-muted-foreground">Reviewer: {p.reviewerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{p.totalScore}</p>
                        <Badge>{p.grade}</Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <ScoreBar label="Disiplin" value={p.discipline || 0} />
                      <ScoreBar label="Kehadiran" value={p.attendance || 0} />
                      <ScoreBar label="Produktivitas" value={p.productivity || 0} />
                      <ScoreBar label="Teamwork" value={p.teamwork || 0} />
                      <ScoreBar label="Inisiatif" value={p.initiative || 0} />
                    </div>
                  </div>
                ))}
                {performanceData.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Belum ada data evaluasi</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Riwayat Cuti & Izin</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leaveData.map((l) => (
                  <div key={l.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50" data-testid={`leave-row-${l.id}`}>
                    <div>
                      <p className="text-sm font-medium">{l.type}</p>
                      <p className="text-xs text-muted-foreground">{l.startDate} s/d {l.endDate} ({l.days} hari)</p>
                      {l.reason && <p className="text-xs text-muted-foreground mt-0.5">{l.reason}</p>}
                    </div>
                    <Badge variant={l.status === "approved" ? "default" : l.status === "rejected" ? "destructive" : "secondary"}>
                      {l.status === "approved" ? "Disetujui" : l.status === "rejected" ? "Ditolak" : "Menunggu"}
                    </Badge>
                  </div>
                ))}
                {leaveData.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Belum ada data cuti</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
        <p className="text-sm truncate">{value}</p>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/50">
      <div className={`w-3 h-3 rounded-full ${color} mx-auto mb-1.5`} />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
      <Progress value={value} className="flex-1 h-2" />
      <span className="text-xs font-medium w-8 text-right">{value}</span>
    </div>
  );
}

function RetirementCard({ birthDate, joinDate }: { birthDate: string; joinDate?: string | null }) {
  const RETIREMENT_AGE = 58;
  const birth = new Date(birthDate);
  const retirementDate = new Date(birth.getFullYear() + RETIREMENT_AGE, birth.getMonth(), birth.getDate());
  const now = new Date();

  const ageMs = now.getTime() - birth.getTime();
  const ageYears = Math.floor(ageMs / (365.25 * 24 * 60 * 60 * 1000));
  const ageMonths = Math.floor((ageMs % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));

  const isRetired = now >= retirementDate;
  const remainMs = retirementDate.getTime() - now.getTime();
  const remainDaysTotal = Math.max(0, Math.ceil(remainMs / (24 * 60 * 60 * 1000)));
  const remainYears = Math.floor(remainDaysTotal / 365);
  const remainMonths = Math.floor((remainDaysTotal % 365) / 30);
  const remainDays = remainDaysTotal % 30;

  const join = joinDate ? new Date(joinDate) : null;
  const totalServiceMs = join ? retirementDate.getTime() - join.getTime() : 0;
  const elapsedServiceMs = join ? now.getTime() - join.getTime() : 0;
  const progressPct = totalServiceMs > 0 ? Math.min(100, Math.max(0, (elapsedServiceMs / totalServiceMs) * 100)) : 0;

  const isUrgent = remainDaysTotal <= 365;
  const borderColor = isRetired ? "border-red-500/50" : isUrgent ? "border-amber-500/50" : "border-border";

  return (
    <Card className={`border-2 ${borderColor}`} data-testid="card-retirement-info">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Info Pensiun
          {isRetired && <Badge variant="destructive" className="text-[10px]">Sudah Pensiun</Badge>}
          {!isRetired && isUrgent && <Badge className="bg-amber-500 text-white text-[10px]">Segera Pensiun</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-[11px] text-muted-foreground font-medium mb-1">Tanggal Lahir</p>
            <p className="text-sm font-semibold" data-testid="text-birth-date">
              {birth.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-[11px] text-muted-foreground font-medium mb-1">Tanggal Pensiun</p>
            <p className="text-sm font-semibold" data-testid="text-retirement-date">
              {retirementDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-[11px] text-muted-foreground font-medium mb-1">Usia Saat Ini</p>
            <p className="text-sm font-semibold" data-testid="text-current-age">{ageYears} tahun {ageMonths} bulan</p>
          </div>
          <div className={`p-3 rounded-lg border ${isRetired ? "bg-red-500/10 border-red-500/30" : isUrgent ? "bg-amber-500/10 border-amber-500/30" : "bg-muted/30 border-border/50"}`}>
            <p className="text-[11px] text-muted-foreground font-medium mb-1">Sisa Waktu Pensiun</p>
            <p className={`text-sm font-semibold ${isRetired ? "text-red-600 dark:text-red-400" : isUrgent ? "text-amber-600 dark:text-amber-400" : ""}`} data-testid="text-retirement-countdown">
              {isRetired ? "Sudah melewati masa pensiun" : `${remainYears} tahun ${remainMonths} bulan ${remainDays} hari lagi`}
            </p>
          </div>
        </div>
        {join && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Progress Masa Kerja</p>
              <p className="text-xs font-medium">{progressPct.toFixed(1)}%</p>
            </div>
            <Progress value={progressPct} className="h-2.5" />
            <div className="flex justify-between mt-1.5">
              <p className="text-[10px] text-muted-foreground">Mulai: {join.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</p>
              <p className="text-[10px] text-muted-foreground">Pensiun: {retirementDate.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    hadir: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    izin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    sakit: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    cuti: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    alpha: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${variants[status] || variants.hadir}`}>
      {status}
    </span>
  );
}
