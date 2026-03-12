import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Employee, Department, Branch, SubDepartment } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Search, Plus, Users, UserCheck, UserCog, Filter, ChevronRight, Mail, Phone, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function Employees() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "Berhasil", description: "Data pegawai berhasil dihapus" });
    },
    onError: (err: any) => {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    },
  });

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: departments = [] } = useQuery<Department[]>({ queryKey: ["/api/departments"] });
  const { data: branches = [] } = useQuery<Branch[]>({ queryKey: ["/api/branches"] });
  const { data: subDepartments = [] } = useQuery<SubDepartment[]>({ queryKey: ["/api/sub-departments"] });

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

  const [officeFilter, setOfficeFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");

  const filtered = employees.filter((emp) => {
    const matchSearch = emp.fullName.toLowerCase().includes(search.toLowerCase()) ||
      emp.nip.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || emp.status === statusFilter;
    const matchType = typeFilter === "all" || emp.employeeType === typeFilter;
    const matchOffice = officeFilter === "all" || emp.officeType === officeFilter;
    const matchBranch = branchFilter === "all" || String(emp.branchId) === branchFilter;
    return matchSearch && matchStatus && matchType && matchOffice && matchBranch;
  });

  const getLocationName = (emp: Employee) => {
    if (emp.officeType === "pusat") {
      const dept = departments.find(d => d.id === emp.departmentId);
      return `Pusat ${dept ? `- ${dept.name}` : ""}`;
    } else {
      const branch = branches.find(b => b.id === emp.branchId);
      return `Cabang ${branch ? `- ${branch.name}` : ""}`;
    }
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
              branches={branches}
              subDepartments={subDepartments}
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
                placeholder="Cari nama atau NIK..."
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
              <Select value={officeFilter} onValueChange={setOfficeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Lokasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Lokasi</SelectItem>
                  <SelectItem value="pusat">Pusat</SelectItem>
                  <SelectItem value="cabang">Cabang</SelectItem>
                </SelectContent>
              </Select>
              {officeFilter === "cabang" && (
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Pilih Cabang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Cabang</SelectItem>
                    {branches.map(b => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
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
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5" title={emp.structuralPosition?.replace(/_/g, ' ').toUpperCase()}>
                      <span>{emp.nip} · {getLocationName(emp)}</span>
                      <Badge 
                        className={`text-[9px] h-4 px-1.5 ${
                          emp.structuralPosition?.includes('direktur') ? 'bg-red-600 hover:bg-red-700 border-transparent text-white' :
                          emp.structuralPosition === 'kabid' ? 'bg-blue-600 hover:bg-blue-700 border-transparent text-white' :
                          emp.structuralPosition === 'kasubbid' ? 'bg-yellow-500 hover:bg-yellow-600 border-transparent text-black' :
                          emp.structuralPosition === 'kepala_cabang' ? 'bg-green-600 hover:bg-green-700 border-transparent text-white' :
                          'bg-gray-500 hover:bg-gray-600 border-transparent text-white'
                        }`}
                      >
                        {emp.structuralPosition?.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
                    {emp.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{emp.email}</span>}
                    {emp.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{emp.phone}</span>}
                  </div>
                  <Badge variant={emp.status === "aktif" ? "default" : "secondary"} className="text-[11px] shrink-0">
                    {emp.status}
                  </Badge>
                  {isSuperAdmin && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (confirm(`Yakin ingin menghapus data pegawai "${emp.fullName}"? Data terkait (absensi, payroll, dll) juga akan terdampak.`)) {
                          deleteMutation.mutate(emp.id);
                        }
                      }}
                      className="p-1.5 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors shrink-0"
                      data-testid={`btn-delete-employee-${emp.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
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

function AddEmployeeForm({ 
  departments, branches, subDepartments, onSubmit, isPending 
}: { 
  departments: Department[]; branches: Branch[]; subDepartments: SubDepartment[];
  onSubmit: (data: any) => void; isPending: boolean 
}) {
  const [form, setForm] = useState({
    nip: "", fullName: "", gender: "Laki-laki", birthPlace: "", birthDate: "",
    address: "", phone: "", email: "", religion: "Islam", education: "", major: "",
    officeType: "pusat", branchId: "", departmentId: "", subDepartmentId: "", structuralPosition: "staff",
    positionId: "", status: "aktif", employeeType: "tetap",
    grade: "", joinDate: "", npwp: "", bpjs: "", bankAccount: "", bankName: "",
    maritalStatus: "Lajang", contractEndDate: "",
  });

  const isPusat = form.officeType === "pusat";
  const disableSubDept = (isPusat && ["direktur_utama", "direktur_umum", "direktur_operasional", "kabid"].includes(form.structuralPosition)) || (!isPusat && form.structuralPosition === "kepala_cabang");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      departmentId: isPusat && form.departmentId ? parseInt(form.departmentId) : null,
      branchId: !isPusat && form.branchId ? parseInt(form.branchId) : null,
      subDepartmentId: !disableSubDept && form.subDepartmentId ? parseInt(form.subDepartmentId) : null,
      positionId: form.positionId ? parseInt(form.positionId) : null,
      contractEndDate: form.contractEndDate || null,
      birthDate: form.birthDate || null,
      joinDate: form.joinDate || null,
      major: form.major || null,
    });
  };

  const inputClass = "w-full";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-muted p-4 rounded-xl border mb-4 space-y-4">
        <h3 className="font-semibold text-sm">Lokasi & Jabatan Struktural</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Tipe Kantor</label>
            <Select value={form.officeType} onValueChange={v => setForm({...form, officeType: v, structuralPosition: v === "pusat" ? "staff" : "staff", departmentId: "", branchId: "", subDepartmentId: ""})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pusat">Kantor Pusat</SelectItem>
                <SelectItem value="cabang">Kantor Cabang</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Jabatan Struktural</label>
            <Select value={form.structuralPosition} onValueChange={v => setForm({...form, structuralPosition: v, subDepartmentId: ""})}>
              <SelectTrigger data-testid="select-position"><SelectValue placeholder="Pilih Jabatan" /></SelectTrigger>
              <SelectContent>
                {isPusat ? (
                  <>
                    <SelectItem value="direktur_utama">Direktur Utama</SelectItem>
                    <SelectItem value="direktur_umum">Direktur Umum</SelectItem>
                    <SelectItem value="direktur_operasional">Direktur Operasional</SelectItem>
                    <SelectItem value="kabid">Kepala Bidang (Kabid)</SelectItem>
                    <SelectItem value="kasubbid">Kepala Sub-Bidang (Kasubbid)</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="kepala_cabang">Kepala Cabang</SelectItem>
                    <SelectItem value="kasubbid">Kepala Bagian (Kasubbid)</SelectItem>
                    <SelectItem value="staff">Staff Cabang</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {isPusat ? (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Bidang {!form.structuralPosition.includes('direktur') && <span className="text-red-500">*</span>}</label>
              <Select value={form.departmentId} onValueChange={v => setForm({...form, departmentId: v})} disabled={form.structuralPosition.includes('direktur')} required={form.structuralPosition !== 'direktur'}>
                <SelectTrigger><SelectValue placeholder="Pilih Bidang" /></SelectTrigger>
                <SelectContent>
                  {departments.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Cabang <span className="text-red-500">*</span></label>
              <Select value={form.branchId} onValueChange={v => setForm({...form, branchId: v})} required>
                <SelectTrigger><SelectValue placeholder="Pilih Cabang" /></SelectTrigger>
                <SelectContent>
                  {branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className={`text-sm font-medium mb-1.5 block ${disableSubDept ? 'text-muted-foreground' : ''}`}>
              Sub-Bidang / Bagian {!disableSubDept && <span className="text-red-500">*</span>}
            </label>
            <Select value={form.subDepartmentId} onValueChange={v => setForm({...form, subDepartmentId: v})} disabled={disableSubDept} required={!disableSubDept}>
              <SelectTrigger><SelectValue placeholder={disableSubDept ? "Tidak Perlu Sub-Bidang" : "Pilih Sub-Bidang"} /></SelectTrigger>
              <SelectContent>
                {subDepartments.filter(sd => isPusat ? sd.departmentId === parseInt(form.departmentId||'0') : sd.branchId === parseInt(form.branchId||'0'))
                  .map(sd => <SelectItem key={sd.id} value={String(sd.id)}>{sd.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {!disableSubDept && (
              <p className="text-[10px] text-muted-foreground mt-1">Note: Pilih Bidang/Cabang terlebih dahulu.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">NIK</label>
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
          <label className="text-sm font-medium mb-1.5 block">Email</label>
          <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inputClass} data-testid="input-email" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">No. HP</label>
          <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className={inputClass} data-testid="input-phone" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Golongan</label>
          <Select value={form.grade} onValueChange={v => setForm({...form, grade: v})}>
            <SelectTrigger data-testid="select-grade"><SelectValue placeholder="Pilih Golongan" /></SelectTrigger>
            <SelectContent>
              {["A/I", "A/II", "A/III", "A/IV", "B/I", "B/II", "B/III", "B/IV", "C/I", "C/II", "C/III", "C/IV", "D/I", "D/II", "D/III", "D/IV", "E/IV"].map(g => (
                <SelectItem key={g} value={g}>Gol. {g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        {form.employeeType === "kontrak" && (
          <div>
            <label className="text-sm font-medium mb-1.5 block">Tanggal Berakhir Kontrak</label>
            <Input type="date" value={form.contractEndDate} onChange={e => setForm({...form, contractEndDate: e.target.value})} className={inputClass} data-testid="input-contract-end-date" />
          </div>
        )}
        <div>
          <label className="text-sm font-medium mb-1.5 block">Pendidikan Dasar/Terakhir</label>
          <Select value={form.education} onValueChange={v => setForm({...form, education: v})}>
            <SelectTrigger data-testid="select-education"><SelectValue placeholder="Pilih Pendidikan" /></SelectTrigger>
            <SelectContent>
              {["SD", "SMP", "SMA/SMK", "D1", "D2", "D3", "D4", "S1", "S2", "S3"].map(level => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Jurusan (Opsional)</label>
          <Input value={form.major} onChange={e => setForm({...form, major: e.target.value})} placeholder="Contoh: Teknik Mesin" className={inputClass} data-testid="input-major" />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isPending} data-testid="btn-submit-employee">
        {isPending ? "Menyimpan..." : "Simpan Pegawai"}
      </Button>
    </form>
  );
}
