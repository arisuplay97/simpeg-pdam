import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Training, Department } from "@shared/schema";
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
import { GraduationCap, Plus, Calendar, MapPin, Users, Clock } from "lucide-react";

export default function TrainingsPage() {
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  const { data: trainingsData = [], isLoading } = useQuery<Training[]>({
    queryKey: ["/api/trainings"],
  });
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/trainings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainings"] });
      setShowDialog(false);
      toast({ title: "Pelatihan berhasil ditambahkan" });
    },
  });

  const statusColors: Record<string, string> = {
    upcoming: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    ongoing: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    completed: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  };

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 rounded-xl" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Pelatihan</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola program pelatihan dan pengembangan pegawai</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="btn-add-training"><Plus className="w-4 h-4" />Tambah Pelatihan</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Pelatihan Baru</DialogTitle></DialogHeader>
            <TrainingForm departments={departments} onSubmit={(d) => createMutation.mutate(d)} isPending={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-blue-500/10"><Clock className="w-5 h-5 text-blue-500" /></div>
          <div><p className="text-xs text-muted-foreground font-medium">Akan Datang</p><p className="text-xl font-bold">{trainingsData.filter(t => t.status === "upcoming").length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-emerald-600/10"><GraduationCap className="w-5 h-5 text-emerald-600" /></div>
          <div><p className="text-xs text-muted-foreground font-medium">Sedang Berlangsung</p><p className="text-xl font-bold">{trainingsData.filter(t => t.status === "ongoing").length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-gray-500/10"><GraduationCap className="w-5 h-5 text-gray-500" /></div>
          <div><p className="text-xs text-muted-foreground font-medium">Selesai</p><p className="text-xl font-bold">{trainingsData.filter(t => t.status === "completed").length}</p></div>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trainingsData.map((t) => {
          const dept = departments.find(d => d.id === t.departmentId);
          return (
            <Card key={t.id} className="hover:shadow-md transition-shadow" data-testid={`training-card-${t.id}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold truncate">{t.title}</h3>
                    {t.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ml-2 ${statusColors[t.status]}`}>
                    {t.status === "upcoming" ? "Akan Datang" : t.status === "ongoing" ? "Berlangsung" : "Selesai"}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  {t.trainer && <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5" /><span>{t.trainer}</span></div>}
                  {t.location && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /><span>{t.location}</span></div>}
                  <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /><span>{new Date(t.startDate).toLocaleDateString('id-ID')} - {new Date(t.endDate).toLocaleDateString('id-ID')}</span></div>
                  {dept && <div className="flex items-center gap-2"><GraduationCap className="w-3.5 h-3.5" /><span>{dept.name}</span></div>}
                  {t.maxParticipants && <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5" /><span>Max. {t.maxParticipants} peserta</span></div>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {trainingsData.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <GraduationCap className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">Belum ada program pelatihan</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TrainingForm({ departments, onSubmit, isPending }: { departments: Department[]; onSubmit: (d: any) => void; isPending: boolean }) {
  const [form, setForm] = useState({ title: "", description: "", trainer: "", location: "", startDate: "", endDate: "", departmentId: "", maxParticipants: "", status: "upcoming" });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, departmentId: form.departmentId ? parseInt(form.departmentId) : null, maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants) : null }); }} className="space-y-4">
      <div><label className="text-sm font-medium mb-1.5 block">Judul</label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required data-testid="input-training-title" /></div>
      <div><label className="text-sm font-medium mb-1.5 block">Deskripsi</label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} data-testid="input-training-desc" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-sm font-medium mb-1.5 block">Trainer</label><Input value={form.trainer} onChange={e => setForm({...form, trainer: e.target.value})} data-testid="input-trainer" /></div>
        <div><label className="text-sm font-medium mb-1.5 block">Lokasi</label><Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} data-testid="input-location" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-sm font-medium mb-1.5 block">Tanggal Mulai</label><Input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} required data-testid="input-training-start" /></div>
        <div><label className="text-sm font-medium mb-1.5 block">Tanggal Selesai</label><Input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} required data-testid="input-training-end" /></div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Bagian</label>
        <Select value={form.departmentId} onValueChange={v => setForm({...form, departmentId: v})}>
          <SelectTrigger data-testid="select-training-dept"><SelectValue placeholder="Semua Bagian" /></SelectTrigger>
          <SelectContent>{departments.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><label className="text-sm font-medium mb-1.5 block">Max Peserta</label><Input type="number" value={form.maxParticipants} onChange={e => setForm({...form, maxParticipants: e.target.value})} data-testid="input-max-participants" /></div>
      <Button type="submit" className="w-full" disabled={isPending} data-testid="btn-submit-training">{isPending ? "Menyimpan..." : "Simpan"}</Button>
    </form>
  );
}
