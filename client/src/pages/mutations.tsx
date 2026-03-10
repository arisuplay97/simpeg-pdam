import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Mutation, Employee } from "@shared/schema";
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
import { ArrowLeftRight, Plus, ArrowRight } from "lucide-react";

export default function MutationsPage() {
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  const { data: mutationsData = [], isLoading } = useQuery<Mutation[]>({
    queryKey: ["/api/mutations"],
  });
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/mutations", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mutations"] });
      setShowDialog(false);
      toast({ title: "Pengajuan mutasi berhasil" });
    },
  });

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 rounded-xl" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Mutasi & Promosi</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola mutasi, promosi, dan demosi pegawai</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="btn-add-mutation"><Plus className="w-4 h-4" />Pengajuan Baru</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Pengajuan Mutasi/Promosi</DialogTitle></DialogHeader>
            <MutationForm employees={employees} onSubmit={(d) => createMutation.mutate(d)} isPending={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-sky-600/10"><ArrowLeftRight className="w-5 h-5 text-sky-600" /></div>
          <div><p className="text-xs text-muted-foreground font-medium">Total Mutasi</p><p className="text-xl font-bold">{mutationsData.filter(m => m.type === "mutasi").length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-emerald-600/10"><ArrowRight className="w-5 h-5 text-emerald-600" /></div>
          <div><p className="text-xs text-muted-foreground font-medium">Promosi</p><p className="text-xl font-bold">{mutationsData.filter(m => m.type === "promosi").length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10"><ArrowLeftRight className="w-5 h-5 text-amber-500" /></div>
          <div><p className="text-xs text-muted-foreground font-medium">Pending</p><p className="text-xl font-bold">{mutationsData.filter(m => m.status === "pending").length}</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {mutationsData.map((m) => {
              const emp = employees.find(e => e.id === m.employeeId);
              return (
                <div key={m.id} className="px-5 py-4 hover:bg-muted/30 transition-colors" data-testid={`mutation-row-${m.id}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-sm font-semibold text-primary">{emp?.fullName?.charAt(0) || "?"}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{emp?.fullName || "—"}</p>
                        <Badge variant="outline" className="text-[10px] mt-1 capitalize">{m.type}</Badge>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                          {m.fromPosition && <span>{m.fromPosition}</span>}
                          {m.fromPosition && m.toPosition && <ArrowRight className="w-3 h-3" />}
                          {m.toPosition && <span className="font-medium text-foreground">{m.toPosition}</span>}
                        </div>
                        {m.fromDepartment && m.toDepartment && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{m.fromDepartment}</span>
                            <ArrowRight className="w-3 h-3" />
                            <span className="font-medium text-foreground">{m.toDepartment}</span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">Efektif: {new Date(m.effectiveDate).toLocaleDateString('id-ID')}</p>
                        {m.reason && <p className="text-xs text-muted-foreground mt-0.5">{m.reason}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {m.skNumber && <span className="text-xs text-muted-foreground">SK: {m.skNumber}</span>}
                      <Badge variant={m.status === "approved" ? "default" : m.status === "rejected" ? "destructive" : "secondary"} className="text-[11px]">
                        {m.status === "approved" ? "Disetujui" : m.status === "rejected" ? "Ditolak" : "Menunggu"}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
            {mutationsData.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <ArrowLeftRight className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">Belum ada data mutasi</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MutationForm({ employees, onSubmit, isPending }: { employees: Employee[]; onSubmit: (d: any) => void; isPending: boolean }) {
  const [form, setForm] = useState({ employeeId: "", type: "mutasi", fromPosition: "", toPosition: "", fromDepartment: "", toDepartment: "", effectiveDate: "", reason: "" });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, employeeId: parseInt(form.employeeId), status: "pending" }); }} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Pegawai</label>
        <Select value={form.employeeId} onValueChange={v => setForm({...form, employeeId: v})}>
          <SelectTrigger data-testid="select-mutation-emp"><SelectValue placeholder="Pilih Pegawai" /></SelectTrigger>
          <SelectContent>{employees.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.fullName}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Jenis</label>
        <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
          <SelectTrigger data-testid="select-mutation-type"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="mutasi">Mutasi</SelectItem>
            <SelectItem value="promosi">Promosi</SelectItem>
            <SelectItem value="demosi">Demosi</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-sm font-medium mb-1.5 block">Jabatan Asal</label><Input value={form.fromPosition} onChange={e => setForm({...form, fromPosition: e.target.value})} data-testid="input-from-pos" /></div>
        <div><label className="text-sm font-medium mb-1.5 block">Jabatan Tujuan</label><Input value={form.toPosition} onChange={e => setForm({...form, toPosition: e.target.value})} data-testid="input-to-pos" /></div>
      </div>
      <div><label className="text-sm font-medium mb-1.5 block">Tanggal Efektif</label><Input type="date" value={form.effectiveDate} onChange={e => setForm({...form, effectiveDate: e.target.value})} required data-testid="input-mutation-date" /></div>
      <div><label className="text-sm font-medium mb-1.5 block">Alasan</label><Textarea value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} data-testid="input-mutation-reason" /></div>
      <Button type="submit" className="w-full" disabled={isPending} data-testid="btn-submit-mutation">{isPending ? "Menyimpan..." : "Ajukan"}</Button>
    </form>
  );
}
