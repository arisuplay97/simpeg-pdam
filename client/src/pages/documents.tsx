import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Document, Employee } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FolderOpen, Plus, Search, FileText, Calendar } from "lucide-react";

const categoryColors: Record<string, string> = {
  "SK Pengangkatan": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "Kontrak Kerja": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "Sertifikat": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "Surat Peringatan": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "SK Mutasi": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  const { data: documentsData = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/documents", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setShowDialog(false);
      toast({ title: "Dokumen berhasil ditambahkan" });
    },
  });

  const categories = [...new Set(documentsData.map(d => d.category))];
  const filtered = documentsData.filter(d => {
    const emp = employees.find(e => e.id === d.employeeId);
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || emp?.fullName.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || d.category === categoryFilter;
    return matchSearch && matchCat;
  });

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 rounded-xl" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Dokumen & Arsip</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola dokumen dan arsip digital pegawai</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="btn-add-document"><Plus className="w-4 h-4" />Tambah Dokumen</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Tambah Dokumen</DialogTitle></DialogHeader>
            <DocumentForm employees={employees} onSubmit={(d) => createMutation.mutate(d)} isPending={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Cari dokumen..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" data-testid="input-search-doc" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-doc-category">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filtered.map((doc) => {
              const emp = employees.find(e => e.id === doc.employeeId);
              return (
                <div key={doc.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors" data-testid={`doc-row-${doc.id}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {emp && <span className="text-xs text-muted-foreground">{emp.fullName}</span>}
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${categoryColors[doc.category] || "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"}`}>
                          {doc.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                    {doc.expiryDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Exp: {new Date(doc.expiryDate).toLocaleDateString('id-ID')}
                      </span>
                    )}
                    {doc.createdAt && <span>{new Date(doc.createdAt).toLocaleDateString('id-ID')}</span>}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <FolderOpen className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">Tidak ada dokumen ditemukan</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DocumentForm({ employees, onSubmit, isPending }: { employees: Employee[]; onSubmit: (d: any) => void; isPending: boolean }) {
  const [form, setForm] = useState({ employeeId: "", title: "", category: "SK Pengangkatan", description: "", expiryDate: "" });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, employeeId: form.employeeId ? parseInt(form.employeeId) : null, uploadedBy: "Admin", expiryDate: form.expiryDate || null }); }} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Pegawai (opsional)</label>
        <Select value={form.employeeId} onValueChange={v => setForm({...form, employeeId: v})}>
          <SelectTrigger data-testid="select-doc-employee"><SelectValue placeholder="Pilih Pegawai" /></SelectTrigger>
          <SelectContent>{employees.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.fullName}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><label className="text-sm font-medium mb-1.5 block">Judul</label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required data-testid="input-doc-title" /></div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Kategori</label>
        <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
          <SelectTrigger data-testid="select-doc-cat"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="SK Pengangkatan">SK Pengangkatan</SelectItem>
            <SelectItem value="Kontrak Kerja">Kontrak Kerja</SelectItem>
            <SelectItem value="SK Mutasi">SK Mutasi</SelectItem>
            <SelectItem value="Sertifikat">Sertifikat</SelectItem>
            <SelectItem value="Surat Peringatan">Surat Peringatan</SelectItem>
            <SelectItem value="Dokumen Keuangan">Dokumen Keuangan</SelectItem>
            <SelectItem value="Lainnya">Lainnya</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div><label className="text-sm font-medium mb-1.5 block">Tanggal Kadaluarsa</label><Input type="date" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} data-testid="input-doc-expiry" /></div>
      <Button type="submit" className="w-full" disabled={isPending} data-testid="btn-submit-doc">{isPending ? "Menyimpan..." : "Simpan"}</Button>
    </form>
  );
}
