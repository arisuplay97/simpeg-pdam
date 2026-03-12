import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { RankPromotion, Employee } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Shield, Plus, ArrowRight, FileCheck, Clock, CheckCircle2, XCircle, Users, ChevronRight } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  diajukan: "Diajukan",
  review_hrd: "Review HRD",
  review_kabag: "Review Kabag",
  approval_direktur: "Approval Direktur",
  approved: "Disetujui",
  rejected: "Ditolak",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  diajukan: "secondary",
  review_hrd: "outline",
  review_kabag: "outline",
  approval_direktur: "outline",
  approved: "default",
  rejected: "destructive",
};

const GRADE_OPTIONS = [
  "A/I", "A/II", "A/III", "A/IV",
  "B/I", "B/II", "B/III", "B/IV",
  "C/I", "C/II", "C/III", "C/IV",
  "D/I", "D/II", "D/III", "D/IV", "E/IV"
];

const STATUS_FLOW = [
  { key: "diajukan", label: "Diajukan" },
  { key: "review_hrd", label: "Review HRD" },
  { key: "review_kabag", label: "Review Kabag" },
  { key: "approval_direktur", label: "Approval Direktur" },
  { key: "approved", label: "Berlaku" },
];

function getStatusIndex(status: string) {
  return STATUS_FLOW.findIndex(s => s.key === status);
}

export default function RankPromotionsPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [rejectDialogId, setRejectDialogId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: promotions = [], isLoading } = useQuery<RankPromotion[]>({
    queryKey: ["/api/rank-promotions"],
  });
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });
  const { data: eligible = [] } = useQuery<Employee[]>({
    queryKey: ["/api/eligible-promotions"],
  });

  const createPromotion = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/rank-promotions", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rank-promotions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/eligible-promotions"] });
      setShowDialog(false);
      toast({ title: "Pengajuan kenaikan pangkat berhasil" });
    },
    onError: (err: Error) => {
      toast({ title: "Gagal mengajukan", description: err.message, variant: "destructive" });
    },
  });

  const approvePromotion = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      const res = await apiRequest("PUT", `/api/rank-promotions/${id}/approve`, { notes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rank-promotions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/eligible-promotions"] });
      toast({ title: "Kenaikan pangkat disetujui" });
    },
    onError: () => {
      toast({ title: "Gagal menyetujui", variant: "destructive" });
    },
  });

  const updatePromotion = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/rank-promotions/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rank-promotions"] });
      toast({ title: "Status berhasil diperbarui" });
      setRejectDialogId(null);
      setRejectReason("");
    },
    onError: (err: Error) => {
      toast({ title: "Gagal memperbarui", description: err.message, variant: "destructive" });
    },
  });

  const filtered = statusFilter === "all"
    ? promotions
    : promotions.filter(p => p.status === statusFilter);

  const totalCount = promotions.length;
  const pendingCount = promotions.filter(p => !["approved", "rejected"].includes(p.status)).length;
  const approvedCount = promotions.filter(p => p.status === "approved").length;
  const rejectedCount = promotions.filter(p => p.status === "rejected").length;

  const canAdvance = (status: string) => {
    if (!user) return false;
    const role = user.role;
    if (status === "diajukan" && (role === "admin" || role === "direktur" || role === "superadmin")) return true;
    if (status === "review_hrd" && (role === "admin" || role === "direktur" || role === "superadmin")) return true;
    if (status === "review_kabag" && (role === "admin" || role === "direktur" || role === "superadmin")) return true;
    if (status === "approval_direktur" && (role === "direktur" || role === "admin" || role === "superadmin")) return true;
    return false;
  };

  const getNextStatus = (current: string): string | null => {
    const idx = STATUS_FLOW.findIndex(s => s.key === current);
    if (idx >= 0 && idx < STATUS_FLOW.length - 1) return STATUS_FLOW[idx + 1].key;
    return null;
  };

  const handleAdvance = (id: number, currentStatus: string) => {
    if (currentStatus === "approval_direktur") {
      approvePromotion.mutate({ id });
    } else {
      const next = getNextStatus(currentStatus);
      if (next) {
        updatePromotion.mutate({ id, data: { status: next } });
      }
    }
  };

  const handleReject = (id: number) => {
    updatePromotion.mutate({ id, data: { status: "rejected", rejectionReason: rejectReason } });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Kenaikan Pangkat</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola pengajuan kenaikan pangkat pegawai (periode 4 tahun)</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="btn-add-promotion">
              <Plus className="w-4 h-4" />Pengajuan Baru
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Pengajuan Kenaikan Pangkat</DialogTitle></DialogHeader>
            <PromotionForm
              employees={employees}
              onSubmit={(d) => createPromotion.mutate(d)}
              isPending={createPromotion.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-sky-600/10"><FileCheck className="w-5 h-5 text-sky-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Pengajuan</p>
              <p className="text-xl font-bold" data-testid="text-total-count">{totalCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-amber-500/10"><Clock className="w-5 h-5 text-amber-500" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Menunggu Approval</p>
              <p className="text-xl font-bold" data-testid="text-pending-count">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-600/10"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Disetujui</p>
              <p className="text-xl font-bold" data-testid="text-approved-count">{approvedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-red-500/10"><XCircle className="w-5 h-5 text-red-500" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Ditolak</p>
              <p className="text-xl font-bold" data-testid="text-rejected-count">{rejectedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list" data-testid="tab-list">Daftar Pengajuan</TabsTrigger>
          <TabsTrigger value="eligible" data-testid="tab-eligible">Pegawai Memenuhi Syarat</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4 mt-4">
          <Card className="p-4">
            <StatusFlowVisualization />
          </Card>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground">Filter:</span>
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              data-testid="filter-all"
            >
              Semua
            </Button>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <Button
                key={key}
                variant={statusFilter === key ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(key)}
                data-testid={`filter-${key}`}
              >
                {label}
              </Button>
            ))}
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="table-promotions">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-3 font-medium">Pegawai</th>
                      <th className="text-left p-3 font-medium">NIK</th>
                      <th className="text-left p-3 font-medium">Pangkat Lama → Baru</th>
                      <th className="text-left p-3 font-medium">Tgl Pengajuan</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => {
                      const emp = employees.find(e => e.id === p.employeeId);
                      return (
                        <tr key={p.id} className="border-b last:border-b-0" data-testid={`row-promotion-${p.id}`}>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="text-xs font-semibold text-primary">{emp?.fullName?.charAt(0) || "?"}</span>
                              </div>
                              <span className="font-medium">{emp?.fullName || "—"}</span>
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground">{emp?.nip || "—"}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground">{p.fromGrade}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="font-medium">{p.toGrade}</span>
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {p.createdAt ? new Date(p.createdAt).toLocaleDateString("id-ID") : "—"}
                          </td>
                          <td className="p-3">
                            <Badge variant={STATUS_VARIANTS[p.status] || "secondary"} data-testid={`badge-status-${p.id}`}>
                              {STATUS_LABELS[p.status] || p.status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              {canAdvance(p.status) && p.status !== "approved" && p.status !== "rejected" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleAdvance(p.id, p.status)}
                                    disabled={updatePromotion.isPending}
                                    data-testid={`btn-advance-${p.id}`}
                                  >
                                    {p.status === "approval_direktur" ? "Setujui" : "Lanjutkan"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => setRejectDialogId(p.id)}
                                    disabled={updatePromotion.isPending}
                                    data-testid={`btn-reject-${p.id}`}
                                  >
                                    Tolak
                                  </Button>
                                </>
                              )}
                              {p.status === "rejected" && p.rejectionReason && (
                                <span className="text-xs text-muted-foreground">Alasan: {p.rejectionReason}</span>
                              )}
                              {p.skNumber && (
                                <span className="text-xs text-muted-foreground">SK: {p.skNumber}</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">Tidak ada data pengajuan</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eligible" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5" />
                Pegawai yang Memenuhi Syarat Kenaikan Pangkat
              </CardTitle>
              <p className="text-sm text-muted-foreground">Pegawai yang telah memenuhi masa kerja 4 tahun sejak kenaikan pangkat terakhir</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {eligible.map((emp) => (
                  <div key={emp.id} className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap" data-testid={`eligible-emp-${emp.id}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-primary">{emp.fullName.charAt(0)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{emp.fullName}</p>
                        <p className="text-xs text-muted-foreground">{emp.nip}</p>
                        {emp.grade && (
                          <Badge variant="outline" className="text-[10px] mt-1">
                            Golongan: {emp.grade}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right text-xs text-muted-foreground">
                        {emp.lastPromotionDate ? (
                          <p>Pangkat terakhir: {new Date(emp.lastPromotionDate).toLocaleDateString("id-ID")}</p>
                        ) : (
                          <p>Bergabung: {new Date(emp.joinDate).toLocaleDateString("id-ID")}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => {
                          setShowDialog(true);
                        }}
                        data-testid={`btn-promote-${emp.id}`}
                      >
                        Ajukan <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                {eligible.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Users className="w-12 h-12 mb-3 opacity-30" />
                    <p className="text-sm font-medium">Belum ada pegawai yang memenuhi syarat</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={rejectDialogId !== null} onOpenChange={(open) => { if (!open) { setRejectDialogId(null); setRejectReason(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tolak Pengajuan</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Alasan Penolakan</label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Masukkan alasan penolakan..."
                data-testid="input-reject-reason"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setRejectDialogId(null); setRejectReason(""); }} data-testid="btn-cancel-reject">
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={() => rejectDialogId && handleReject(rejectDialogId)}
                disabled={!rejectReason.trim() || updatePromotion.isPending}
                data-testid="btn-confirm-reject"
              >
                {updatePromotion.isPending ? "Memproses..." : "Tolak Pengajuan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusFlowVisualization() {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1" data-testid="status-flow">
      {STATUS_FLOW.map((step, i) => (
        <div key={step.key} className="flex items-center gap-1">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted/50 whitespace-nowrap">
            <div className={`w-2 h-2 rounded-full ${i === STATUS_FLOW.length - 1 ? "bg-emerald-500" : "bg-sky-500"}`} />
            <span className="text-xs font-medium">{step.label}</span>
          </div>
          {i < STATUS_FLOW.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
        </div>
      ))}
    </div>
  );
}

function PromotionForm({ employees, onSubmit, isPending }: { employees: Employee[]; onSubmit: (d: any) => void; isPending: boolean }) {
  const [form, setForm] = useState({
    employeeId: "",
    toGrade: "",
    scheduledDate: "",
  });

  const selectedEmployee = employees.find(e => String(e.id) === form.employeeId);
  const currentGrade = selectedEmployee?.grade || "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      employeeId: parseInt(form.employeeId),
      fromGrade: currentGrade,
      toGrade: form.toGrade,
      scheduledDate: form.scheduledDate,
      status: "diajukan",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Pegawai</label>
        <Select value={form.employeeId} onValueChange={v => setForm({ ...form, employeeId: v, toGrade: "" })}>
          <SelectTrigger data-testid="select-promotion-emp"><SelectValue placeholder="Pilih Pegawai" /></SelectTrigger>
          <SelectContent>
            {employees.map(e => (
              <SelectItem key={e.id} value={String(e.id)}>{e.fullName} ({e.nip})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedEmployee && (
        <div className="p-3 rounded-md bg-muted/50 space-y-1">
          <p className="text-xs text-muted-foreground">Pangkat saat ini</p>
          <p className="text-sm font-medium" data-testid="text-current-grade">{currentGrade || "Belum ditentukan"}</p>
        </div>
      )}

      <div>
        <label className="text-sm font-medium mb-1.5 block">Pangkat Tujuan</label>
        <Select value={form.toGrade} onValueChange={v => setForm({ ...form, toGrade: v })}>
          <SelectTrigger data-testid="select-target-grade"><SelectValue placeholder="Pilih Pangkat Tujuan" /></SelectTrigger>
          <SelectContent>
            {GRADE_OPTIONS.filter(g => g !== currentGrade).map(g => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Tanggal Dijadwalkan</label>
        <Input
          type="date"
          value={form.scheduledDate}
          onChange={e => setForm({ ...form, scheduledDate: e.target.value })}
          required
          data-testid="input-scheduled-date"
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isPending || !form.employeeId || !form.toGrade || !form.scheduledDate}
        data-testid="btn-submit-promotion"
      >
        {isPending ? "Menyimpan..." : "Ajukan Kenaikan Pangkat"}
      </Button>
    </form>
  );
}
