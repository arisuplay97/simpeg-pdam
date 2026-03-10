import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Employee, Department } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Search, Plus, Users, UserCheck, UserCog, Filter, ChevronRight, Mail, Phone } from "lucide-react";

export default function Employees() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/employees", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setShowAddDialog(false);
      toast({ title: "Berhasil", description: "Pegawai baru berhasil ditambahkan" });
    },
  });

  const filtered = employees.filter((emp) => {
    const matchSearch = emp.fullName.toLowerCase().includes(search.toLowerCase()) ||
      emp.nip.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || emp.status === statusFilter;
    const matchType = typeFilter === "all" || emp.employeeType === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const getDeptName = (deptId: number | null) => {
    if (!deptId) return "—";
    const dept = departments.find(d => d.id === deptId);
    return dept?.name || "—";
  };

  const activeCount = employees.filter(e => e.status === "aktif").length;
  const contractCount = employees.filter(e => e.employeeType === "kontrak").length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Data Pegawai</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola data seluruh pegawai PDAM</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="btn-add-employee">
              <Plus className="w-4 h-4" /> Tambah Pegawai
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Pegawai Baru</DialogTitle>
            </DialogHeader>
            <AddEmployeeForm
              departments={departments}
              onSubmit={(data) => createMutation.mutate(data)}
              isPending={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-sky-600/10"><Users className="w-5 h-5 text-sky-600" /></div>
            <div><p className="text-xs text-muted-foreground font-medium">Total Pegawai</p><p className="text-xl font-bold">{employees.length}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-600/10"><UserCheck className="w-5 h-5 text-emerald-600" /></div>
            <div><p className="text-xs text-muted-foreground font-medium">Pegawai Aktif</p><p className="text-xl font-bold">{activeCount}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-amber-500/10"><UserCog className="w-5 h-5 text-amber-500" /></div>
            <div><p className="text-xs text-muted-foreground font-medium">Pegawai Kontrak</p><p className="text-xl font-bold">{contractCount}</p></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau NIP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-employee"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="nonaktif">Non-Aktif</SelectItem>
                  <SelectItem value="pensiun">Pensiun</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-type-filter">
                  <SelectValue placeholder="Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="tetap">Tetap</SelectItem>
                  <SelectItem value="kontrak">Kontrak</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filtered.map((emp) => (
              <Link key={emp.id} href={`/employees/${emp.id}`}>
                <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 transition-colors cursor-pointer group" data-testid={`employee-row-${emp.id}`}>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-primary">{emp.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{emp.fullName}</p>
                      <Badge variant={emp.employeeType === "kontrak" ? "secondary" : "outline"} className="text-[10px] shrink-0">
                        {emp.employeeType}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{emp.nip} · {getDeptName(emp.departmentId)}</p>
                  </div>
                  <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
                    {emp.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{emp.email}</span>}
                    {emp.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{emp.phone}</span>}
                  </div>
                  <Badge variant={emp.status === "aktif" ? "default" : "secondary"} className="text-[11px] shrink-0">
                    {emp.status}
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Users className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">Tidak ada pegawai ditemukan</p>
                <p className="text-xs mt-1">Coba ubah filter pencarian</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AddEmployeeForm({ departments, onSubmit, isPending }: { departments: Department[]; onSubmit: (data: any) => void; isPending: boolean }) {
  const [form, setForm] = useState({
    nip: "", fullName: "", gender: "Laki-laki", birthPlace: "", birthDate: "",
    address: "", phone: "", email: "", religion: "Islam", education: "",
    departmentId: "", positionId: "", status: "aktif", employeeType: "tetap",
    grade: "", joinDate: "", npwp: "", bpjs: "", bankAccount: "", bankName: "",
    maritalStatus: "Lajang",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      departmentId: form.departmentId ? parseInt(form.departmentId) : null,
      positionId: form.positionId ? parseInt(form.positionId) : null,
    });
  };

  const inputClass = "w-full";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">NIP</label>
          <Input value={form.nip} onChange={e => setForm({...form, nip: e.target.value})} required className={inputClass} data-testid="input-nip" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Nama Lengkap</label>
          <Input value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} required className={inputClass} data-testid="input-fullname" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Jenis Kelamin</label>
          <Select value={form.gender} onValueChange={v => setForm({...form, gender: v})}>
            <SelectTrigger data-testid="select-gender"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Laki-laki">Laki-laki</SelectItem>
              <SelectItem value="Perempuan">Perempuan</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Bagian</label>
          <Select value={form.departmentId} onValueChange={v => setForm({...form, departmentId: v})}>
            <SelectTrigger data-testid="select-department"><SelectValue placeholder="Pilih Bagian" /></SelectTrigger>
            <SelectContent>
              {departments.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Email</label>
          <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inputClass} data-testid="input-email" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">No. HP</label>
          <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className={inputClass} data-testid="input-phone" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Status</label>
          <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
            <SelectTrigger data-testid="select-emp-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="aktif">Aktif</SelectItem>
              <SelectItem value="nonaktif">Non-Aktif</SelectItem>
              <SelectItem value="pensiun">Pensiun</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Tipe Pegawai</label>
          <Select value={form.employeeType} onValueChange={v => setForm({...form, employeeType: v})}>
            <SelectTrigger data-testid="select-emp-type"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="tetap">Tetap</SelectItem>
              <SelectItem value="kontrak">Kontrak</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Tanggal Masuk</label>
          <Input type="date" value={form.joinDate} onChange={e => setForm({...form, joinDate: e.target.value})} required className={inputClass} data-testid="input-join-date" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Pendidikan</label>
          <Input value={form.education} onChange={e => setForm({...form, education: e.target.value})} className={inputClass} data-testid="input-education" />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isPending} data-testid="btn-submit-employee">
        {isPending ? "Menyimpan..." : "Simpan Pegawai"}
      </Button>
    </form>
  );
}
