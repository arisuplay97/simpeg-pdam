import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { SalaryIncrease, Employee } from "@shared/schema";
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
import { useAuth } from "@/lib/auth";
import { TrendingUp, Plus, ArrowRight, CheckCircle, XCircle, Clock, DollarSign, Users, AlertTriangle, Trash2 } from "lucide-react";

const statusLabels: Record<string, string> = {
  pending: "Menunggu",
  review: "Review",
  approved: "Disetujui",
  rejected: "Ditolak",
};

const statusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "approved": return "default";
    case "rejected": return "destructive";
    case "review": return "outline";
    default: return "secondary";
  }
};

function formatCurrency(val: string | number | null | undefined): string {
  if (!val) return "Rp 0";
  const num = typeof val === "string" ? parseFloat(val) : val;
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
}

export default function SalaryIncreasesPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";

  const { data: salaryIncreases = [], isLoading } = useQuery<SalaryIncrease[]>({
    queryKey: ["/api/salary-increases"],
  });
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });
  const { data: eligibleEmployees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/eligible-salary-increases"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/salary-increases", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salary-increases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/eligible-salary-increases"] });
      setShowDialog(false);
      toast({ title: "Pengajuan kenaikan gaji berhasil dibuat" });
    },
    onError: (error: any) => {
      toast({ title: "Gagal membuat pengajuan", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/salary-increases/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salary-increases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/eligible-salary-increases"] });
      setRejectId(null);
      setRejectReason("");
      toast({ title: "Status berhasil diperbarui" });
    },
    onError: (error: any) => {
      toast({ title: "Gagal memperbarui status", description: error.message, variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/salary-increases/${id}/approve`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salary-increases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/eligible-salary-increases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "Kenaikan gaji disetujui" });
    },
    onError: (error: any) => {
      toast({ title: "Gagal menyetujui", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/salary-increases/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salary-increases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/eligible-salary-increases"] });
      toast({ title: "Data kenaikan gaji dihapus" });
    },
  });

  const total = salaryIncreases.length;
  const pending = salaryIncreases.filter(s => s.status === "pending" || s.status === "review").length;
  const approved = salaryIncreases.filter(s => s.status === "approved").length;
  const rejected = salaryIncreases.filter(s => s.status === "rejected").length;

  const filtered = statusFilter === "all"
    ? salaryIncreases
    : salaryIncreases.filter(s => s.status === statusFilter);

  const canApprove = user?.role === "direktur" || user?.role === "superadmin";
  const canReview = user?.role === "admin" || user?.role === "direktur" || user?.role === "superadmin";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Kenaikan Gaji Berkala</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola pengajuan kenaikan gaji berkala pegawai (setiap 2 tahun)</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="btn-add-salary-increase">
              <Plus className="w-4 h-4" />Pengajuan Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Pengajuan Kenaikan Gaji</DialogTitle></DialogHeader>
            <SalaryIncreaseForm
              employees={employees}
              onSubmit={(d) => createMutation.mutate(d)}
              isPending={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-sky-600/10">
              <DollarSign className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Pengajuan</p>
              <p className="text-xl font-bold" data-testid="text-total-count">{total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-amber-500/10">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Menunggu</p>
              <p className="text-xl font-bold" data-testid="text-pending-count">{pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-600/10">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Disetujui</p>
              <p className="text-xl font-bold" data-testid="text-approved-count">{approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-red-500/10">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Ditolak</p>
              <p className="text-xl font-bold" data-testid="text-rejected-count">{rejected}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">Filter:</span>
        {["all", "pending", "review", "approved", "rejected"].map(s => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(s)}
            data-testid={`btn-filter-${s}`}
          >
            {s === "all" ? "Semua" : statusLabels[s] || s}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Pegawai</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Gaji Lama</th>
                  <th className="text-left p-3 font-medium text-muted-foreground"></th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Gaji Baru</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Kenaikan</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Skor Kinerja</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Tanggal Berlaku</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => {
                  const emp = employees.find(e => e.id === item.employeeId);
                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-salary-increase-${item.id}`}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold text-primary">{emp?.fullName?.charAt(0) || "?"}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{emp?.fullName || "—"}</p>
                            <p className="text-xs text-muted-foreground">{emp?.nip}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-sm">{formatCurrency(item.fromSalary)}</td>
                      <td className="p-3"><ArrowRight className="w-4 h-4 text-muted-foreground" /></td>
                      <td className="p-3 text-sm font-medium">{formatCurrency(item.toSalary)}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-xs">
                          {item.increasePercentage}%
                        </Badge>
                      </td>
                      <td className="p-3">
                        {item.performanceScore != null ? (
                          <span className="text-sm">{item.performanceScore}/100</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3 text-sm">
                        {new Date(item.effectiveDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="p-3">
                        <Badge variant={statusVariant(item.status)} className="text-xs" data-testid={`badge-status-${item.id}`}>
                          {statusLabels[item.status] || item.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {canReview && item.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateMutation.mutate({ id: item.id, data: { status: "review" } })}
                              disabled={updateMutation.isPending}
                              data-testid={`btn-review-${item.id}`}
                            >
                              Review
                            </Button>
                          )}
                          {canApprove && (item.status === "review" || item.status === "pending") && (
                            <Button
                              size="sm"
                              onClick={() => approveMutation.mutate(item.id)}
                              disabled={approveMutation.isPending}
                              data-testid={`btn-approve-${item.id}`}
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              Setujui
                            </Button>
                          )}
                          {canReview && (item.status === "pending" || item.status === "review") && (
                            <>
                              {rejectId === item.id ? (
                                <div className="flex items-center gap-1.5">
                                  <Input
                                    className="text-xs"
                                    placeholder="Alasan penolakan..."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    data-testid={`input-reject-reason-${item.id}`}
                                  />
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      updateMutation.mutate({
                                        id: item.id,
                                        data: { status: "rejected", rejectionReason: rejectReason },
                                      });
                                    }}
                                    disabled={updateMutation.isPending || !rejectReason}
                                    data-testid={`btn-confirm-reject-${item.id}`}
                                  >
                                    Tolak
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => { setRejectId(null); setRejectReason(""); }}
                                    data-testid={`btn-cancel-reject-${item.id}`}
                                  >
                                    Batal
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setRejectId(item.id)}
                                  data-testid={`btn-reject-${item.id}`}
                                >
                                  <XCircle className="w-3.5 h-3.5 mr-1" />
                                  Tolak
                                </Button>
                              )}
                            </>
                          )}
                          {item.status === "approved" && (
                            <span className="text-xs text-muted-foreground">Selesai</span>
                          )}
                          {item.status === "rejected" && item.rejectionReason && (
                            <span className="text-xs text-muted-foreground italic max-w-[150px] truncate" title={item.rejectionReason}>
                              {item.rejectionReason}
                            </span>
                          )}
                          {isSuperAdmin && (
                            <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                              onClick={() => {
                                if(confirm("Apakah Anda yakin ingin menghapus data kenaikan gaji ini?")) {
                                  deleteMutation.mutate(item.id);
                                }
                              }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">Belum ada data kenaikan gaji</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {eligibleEmployees.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Pegawai Memenuhi Syarat Kenaikan Gaji
            </CardTitle>
            <Badge variant="secondary" className="text-xs">{eligibleEmployees.length} pegawai</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {eligibleEmployees.map((emp) => {
                const yearsSince = emp.lastSalaryIncreaseDate
                  ? ((Date.now() - new Date(emp.lastSalaryIncreaseDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)).toFixed(1)
                  : emp.joinDate
                    ? ((Date.now() - new Date(emp.joinDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)).toFixed(1)
                    : "—";
                return (
                  <div key={emp.id} className="px-5 py-3 flex items-center justify-between gap-4" data-testid={`eligible-emp-${emp.id}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{emp.fullName}</p>
                        <p className="text-xs text-muted-foreground">{emp.nip} &middot; Golongan: {emp.grade || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground">{yearsSince} tahun sejak kenaikan terakhir</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowDialog(true)}
                        data-testid={`btn-propose-salary-${emp.id}`}
                      >
                        Ajukan
                      </Button>
                    </div>
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

const GRADE_BASE_SALARY: Record<string, number> = {
  "A/I": 1560800, "B/I": 1704500, "C/I": 1776000, "D/I": 1851800,
  "A/II": 2022200, "B/II": 2208400, "C/II": 2301800, "D/II": 2399200,
  "A/III": 2579400, "B/III": 2688500, "C/III": 2802300, "D/III": 2920800,
  "A/IV": 3044300, "B/IV": 3173100, "C/IV": 3307300, "D/IV": 3447200, "E/IV": 3593100,
};

function SalaryIncreaseForm({ employees, onSubmit, isPending }: {
  employees: Employee[];
  onSubmit: (d: any) => void;
  isPending: boolean;
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [fromSalary, setFromSalary] = useState("");
  const [toSalary, setToSalary] = useState("");
  const [increasePercentage, setIncreasePercentage] = useState("");
  const [performanceScore, setPerformanceScore] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");

  const handleEmployeeChange = (val: string) => {
    setEmployeeId(val);
    const emp = employees.find(e => e.id === parseInt(val));
    if (emp?.grade && GRADE_BASE_SALARY[emp.grade]) {
      const base = GRADE_BASE_SALARY[emp.grade];
      setFromSalary(String(base));
      recalculate(String(base), performanceScore);
    }
  };

  const recalculate = (baseSalary: string, score: string) => {
    const base = parseFloat(baseSalary);
    const sc = parseInt(score);
    if (!base || isNaN(base)) return;

    let pct = 5;
    if (sc >= 90) pct = 10;
    else if (sc >= 80) pct = 8;
    else if (sc >= 70) pct = 6;
    else if (sc >= 60) pct = 5;
    else pct = 3;

    const newSalary = base + (base * pct / 100);
    setIncreasePercentage(String(pct));
    setToSalary(String(Math.round(newSalary)));
  };

  const handleScoreChange = (val: string) => {
    setPerformanceScore(val);
    recalculate(fromSalary, val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      employeeId: parseInt(employeeId),
      fromSalary,
      toSalary,
      increasePercentage,
      performanceScore: performanceScore ? parseInt(performanceScore) : null,
      effectiveDate,
      scheduledDate: scheduledDate || effectiveDate,
      status: "pending",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Pegawai</label>
        <Select value={employeeId} onValueChange={handleEmployeeChange}>
          <SelectTrigger data-testid="select-salary-emp"><SelectValue placeholder="Pilih Pegawai" /></SelectTrigger>
          <SelectContent>
            {employees.map(e => (
              <SelectItem key={e.id} value={String(e.id)}>
                {e.fullName} ({e.grade || "Tanpa golongan"})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Skor Kinerja (0-100)</label>
        <Input
          type="number"
          min="0"
          max="100"
          value={performanceScore}
          onChange={(e) => handleScoreChange(e.target.value)}
          placeholder="Masukkan skor kinerja"
          data-testid="input-performance-score"
        />
        {performanceScore && (
          <p className="text-xs text-muted-foreground mt-1">
            Kenaikan otomatis: {increasePercentage}% berdasarkan skor kinerja
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Gaji Lama</label>
          <Input
            type="number"
            value={fromSalary}
            onChange={(e) => { setFromSalary(e.target.value); recalculate(e.target.value, performanceScore); }}
            placeholder="Gaji saat ini"
            data-testid="input-from-salary"
          />
          {fromSalary && <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(fromSalary)}</p>}
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Gaji Baru</label>
          <Input
            type="number"
            value={toSalary}
            onChange={(e) => setToSalary(e.target.value)}
            placeholder="Gaji setelah kenaikan"
            data-testid="input-to-salary"
          />
          {toSalary && <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(toSalary)}</p>}
        </div>
      </div>
      {increasePercentage && (
        <div className="p-3 rounded-md bg-muted/50 text-sm">
          Persentase kenaikan: <span className="font-semibold">{increasePercentage}%</span>
          {fromSalary && toSalary && (
            <span className="text-muted-foreground"> ({formatCurrency(fromSalary)} → {formatCurrency(toSalary)})</span>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Tanggal Berlaku</label>
          <Input
            type="date"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            required
            data-testid="input-effective-date"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Tanggal Dijadwalkan</label>
          <Input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            data-testid="input-scheduled-date"
          />
        </div>
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={isPending || !employeeId || !fromSalary || !toSalary || !effectiveDate}
        data-testid="btn-submit-salary-increase"
      >
        {isPending ? "Menyimpan..." : "Ajukan Kenaikan Gaji"}
      </Button>
    </form>
  );
}
