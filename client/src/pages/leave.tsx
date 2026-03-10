import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { LeaveRequest, Employee } from "@shared/schema";
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
import { FileText, Plus, Clock, CheckCircle2, XCircle, Calendar, ArrowRight } from "lucide-react";

export default function LeavePage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  const { data: leaveRequests = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests"],
  });
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/leave-requests", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      setShowDialog(false);
      toast({ title: "Berhasil", description: "Pengajuan cuti berhasil dibuat" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PUT", `/api/leave-requests/${id}`, { status, approvedBy: "Admin" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      toast({ title: "Status diperbarui" });
    },
  });

  const filtered = leaveRequests.filter(lr => statusFilter === "all" || lr.status === statusFilter);
  const pendingCount = leaveRequests.filter(lr => lr.status === "pending").length;
  const approvedCount = leaveRequests.filter(lr => lr.status === "approved").length;
  const rejectedCount = leaveRequests.filter(lr => lr.status === "rejected").length;

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 rounded-xl" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Cuti & Izin</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola pengajuan cuti, izin, dan dinas luar</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="btn-add-leave"><Plus className="w-4 h-4" />Pengajuan Baru</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Pengajuan Cuti / Izin</DialogTitle></DialogHeader>
            <LeaveForm employees={employees} onSubmit={(d) => createMutation.mutate(d)} isPending={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10"><Clock className="w-5 h-5 text-amber-500" /></div>
          <div><p className="text-xs text-muted-foreground font-medium">Menunggu Approval</p><p className="text-xl font-bold">{pendingCount}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-emerald-600/10"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div>
          <div><p className="text-xs text-muted-foreground font-medium">Disetujui</p><p className="text-xl font-bold">{approvedCount}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-red-500/10"><XCircle className="w-5 h-5 text-red-500" /></div>
          <div><p className="text-xs text-muted-foreground font-medium">Ditolak</p><p className="text-xl font-bold">{rejectedCount}</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]" data-testid="select-leave-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Menunggu</SelectItem>
                <SelectItem value="approved">Disetujui</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filtered.map((lr) => {
              const emp = employees.find(e => e.id === lr.employeeId);
              return (
                <div key={lr.id} className="px-5 py-4 hover:bg-muted/30 transition-colors" data-testid={`leave-row-${lr.id}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-sm font-semibold text-primary">{emp?.fullName?.charAt(0) || "?"}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{emp?.fullName || "—"}</p>
                        <p className="text-xs text-muted-foreground">{emp?.nip}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="outline" className="text-[10px]">{lr.type}</Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {lr.startDate} <ArrowRight className="w-3 h-3" /> {lr.endDate}
                          </span>
                          <span className="text-xs text-muted-foreground">({lr.days} hari)</span>
                        </div>
                        {lr.reason && <p className="text-xs text-muted-foreground mt-1">{lr.reason}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {lr.status === "pending" && (
                        <>
                          <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            onClick={() => approveMutation.mutate({ id: lr.id, status: "approved" })} data-testid={`btn-approve-${lr.id}`}>
                            Setujui
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => approveMutation.mutate({ id: lr.id, status: "rejected" })} data-testid={`btn-reject-${lr.id}`}>
                            Tolak
                          </Button>
                        </>
                      )}
                      <Badge variant={lr.status === "approved" ? "default" : lr.status === "rejected" ? "destructive" : "secondary"} className="text-[11px]">
                        {lr.status === "approved" ? "Disetujui" : lr.status === "rejected" ? "Ditolak" : "Menunggu"}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <FileText className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">Tidak ada pengajuan</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LeaveForm({ employees, onSubmit, isPending }: { employees: Employee[]; onSubmit: (d: any) => void; isPending: boolean }) {
  const [form, setForm] = useState({ employeeId: "", type: "Cuti Tahunan", startDate: "", endDate: "", days: 1, reason: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, employeeId: parseInt(form.employeeId), status: "pending" });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Pegawai</label>
        <Select value={form.employeeId} onValueChange={v => setForm({...form, employeeId: v})}>
          <SelectTrigger data-testid="select-leave-employee"><SelectValue placeholder="Pilih Pegawai" /></SelectTrigger>
          <SelectContent>{employees.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.fullName}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Jenis</label>
        <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
          <SelectTrigger data-testid="select-leave-type"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Cuti Tahunan">Cuti Tahunan</SelectItem>
            <SelectItem value="Cuti Sakit">Cuti Sakit</SelectItem>
            <SelectItem value="Cuti Melahirkan">Cuti Melahirkan</SelectItem>
            <SelectItem value="Izin Pribadi">Izin Pribadi</SelectItem>
            <SelectItem value="Dinas Luar">Dinas Luar</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-sm font-medium mb-1.5 block">Tanggal Mulai</label><Input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} required data-testid="input-leave-start" /></div>
        <div><label className="text-sm font-medium mb-1.5 block">Tanggal Selesai</label><Input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} required data-testid="input-leave-end" /></div>
      </div>
      <div><label className="text-sm font-medium mb-1.5 block">Jumlah Hari</label><Input type="number" value={form.days} onChange={e => setForm({...form, days: parseInt(e.target.value)})} min={1} data-testid="input-leave-days" /></div>
      <div><label className="text-sm font-medium mb-1.5 block">Alasan</label><Textarea value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} rows={3} data-testid="input-leave-reason" /></div>
      <Button type="submit" className="w-full" disabled={isPending} data-testid="btn-submit-leave">{isPending ? "Menyimpan..." : "Ajukan"}</Button>
    </form>
  );
}
