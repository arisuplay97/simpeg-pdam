import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
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
  const [, setLocation] = useLocation();
  const isSuperAdmin = user?.role === "superadmin";
  const isPegawai = user?.role === "pegawai" || !user?.role;

  useEffect(() => {
    if (isPegawai && user?.employeeId) {
      setLocation(`/employees/${user.employeeId}`);
    }
  }, [isPegawai, user?.employeeId, setLocation]);

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

  if (isPegawai) return null;

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

  const retirementCount = employees.filter(e => {
    if (e.status !== "aktif" || e.employeeType === "kontrak" || !e.birthDate) return false;
    const end = new Date(new Date(e.birthDate).getFullYear() + 56, new Date(e.birthDate).getMonth(), new Date(e.birthDate).getDate());
    const remainDays = (end.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return remainDays > 0 && remainDays <= 365 * 5;
  }).length;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900" data-testid="text-page-title">Data Pegawai</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola data seluruh pegawai dan direksi PDAM</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="bg-white gap-2 shadow-sm rounded-xl border-slate-200 text-slate-600 hover:text-slate-900 transition-all font-medium">
             Import Excel
          </Button>
          <Button variant="outline" size="icon" className="bg-white shadow-sm rounded-xl border-slate-200 text-slate-600 hover:text-slate-900 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl shadow-sm bg-blue-600 hover:bg-blue-700 text-white font-medium" data-testid="btn-add-employee">
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-panel border-0 hover-scale">
          <CardContent className="p-5 flex items-start gap-4">
             <div className="p-3 rounded-xl bg-blue-50 text-blue-600 shrink-0"><Users className="w-6 h-6" /></div>
             <div>
               <p className="text-sm text-slate-500 font-medium mb-1">Total Pegawai</p>
               <div className="flex items-baseline gap-2">
                 <p className="text-2xl font-bold text-slate-800">{employees.length}</p>
               </div>
               <p className="text-xs text-slate-400 mt-1">Seluruh Divisi</p>
             </div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-0 hover-scale">
          <CardContent className="p-5 flex items-start gap-4">
             <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 shrink-0"><UserCheck className="w-6 h-6" /></div>
             <div>
               <p className="text-sm text-slate-500 font-medium mb-1">Pegawai Aktif</p>
               <div className="flex items-baseline gap-2">
                 <p className="text-2xl font-bold text-slate-800">{activeCount}</p>
               </div>
               <p className="text-xs text-slate-400 mt-1">Saat ini bekerja</p>
             </div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-0 hover-scale">
          <CardContent className="p-5 flex items-start gap-4">
             <div className="p-3 rounded-xl bg-slate-100 text-slate-600 shrink-0"><FileText className="w-6 h-6" /></div>
             <div>
               <p className="text-sm text-slate-500 font-medium mb-1">Pegawai Kontrak</p>
               <div className="flex items-baseline gap-2">
                 <p className="text-2xl font-bold text-slate-800">{contractCount}</p>
               </div>
               <p className="text-xs text-slate-400 mt-1">Perlu tinjauan</p>
             </div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-0 hover-scale">
          <CardContent className="p-5 flex items-start gap-4">
             <div className="p-3 rounded-xl bg-amber-50 text-amber-600 shrink-0"><Timer className="w-6 h-6" /></div>
             <div>
               <p className="text-sm text-slate-500 font-medium mb-1">Mendekati Pensiun</p>
               <div className="flex items-baseline gap-2">
                 <p className="text-2xl font-bold text-slate-800">{retirementCount}</p>
               </div>
               <p className="text-xs text-slate-400 mt-1">Dalam 5 tahun</p>
             </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white/60 backdrop-blur-sm">
        <div className="p-5 border-b border-slate-100 bg-white/40">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-lg w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Cari nama, NIK, atau jabatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white border-slate-200 rounded-xl shadow-sm focus-visible:ring-blue-500 w-full h-11"
                data-testid="input-search-employee"
              />
            </div>
            <div className="flex gap-3 flex-wrap items-center">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-10 rounded-xl border-slate-200 bg-white font-medium text-slate-600">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="nonaktif">Non-Aktif</SelectItem>
                  <SelectItem value="pensiun">Pensiun</SelectItem>
                </SelectContent>
              </Select>
              <Select value={officeFilter} onValueChange={setOfficeFilter}>
                <SelectTrigger className="w-[140px] h-10 rounded-xl border-slate-200 bg-white font-medium text-slate-600">
                  <SelectValue placeholder="Semua Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Unit</SelectItem>
                  <SelectItem value="pusat">Kantor Pusat</SelectItem>
                  <SelectItem value="cabang">Cabang</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px] h-10 rounded-xl border-slate-200 bg-white font-medium text-slate-600">
                  <SelectValue placeholder="Semua Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="tetap">Pegawai Tetap</SelectItem>
                  <SelectItem value="kontrak">Pegawai Kontrak</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" className="gap-2 h-10 rounded-xl border-slate-200 font-medium" onClick={() => { setSearch(''); setStatusFilter('all'); setOfficeFilter('all'); setTypeFilter('all'); setBranchFilter('all'); }}>
                <span className="hidden sm:inline">Reset</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="p-0">
          {/* Header Row (Hidden on mobile) */}
          <div className="hidden lg:grid grid-cols-[1.8fr_1fr_1fr_0.8fr_1fr] gap-4 p-4 border-b border-slate-100 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="pl-2">Karyawan</div>
            <div>Jabatan & Unit</div>
            <div>Demografi / Kontak</div>
            <div>Masa Kerja</div>
            <div className="text-right pr-2">Aksi</div>
          </div>

          <div className="divide-y divide-slate-100">
            {filtered.map((emp) => {
              const years = Math.floor((Date.now() - new Date(emp.joinDate).getTime()) / (1000 * 60 * 60 * 24 * 365));
              const months = Math.floor(((Date.now() - new Date(emp.joinDate).getTime()) / (1000 * 60 * 60 * 24) % 365) / 30);
              
              return (
                <div key={emp.id} className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr_1fr_0.8fr_1fr] gap-4 p-4 items-center hover:bg-blue-50/30 transition-colors group">
                  
                  {/* Karyawan Profile */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-100 flex items-center justify-center shrink-0 shadow-sm relative">
                      <span className="text-base font-bold text-blue-700">{emp.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                      {emp.status === "aktif" && (
                         <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">{emp.fullName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 font-mono">{emp.nip}</span>
                        <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider rounded-md px-1.5 h-4 border-0 ${emp.employeeType === 'kontrak' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                          {emp.employeeType}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Jabatan & Unit */}
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm font-medium text-slate-800 line-clamp-1" title={emp.structuralPosition?.replace(/_/g, ' ').toUpperCase()}>
                       {emp.structuralPosition?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Staf'}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                       <Building2 className="w-3.5 h-3.5" />
                       <span className="truncate">{getLocationName(emp)}</span>
                    </p>
                  </div>

                  {/* Kontak & Demografi */}
                  <div className="flex flex-col gap-1.5 justify-center">
                    {emp.grade && <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"><Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-0 h-5 text-[10px]">Gol. {emp.grade}</Badge></span>}
                    <div className="flex flex-col gap-1">
                       {emp.phone && <span className="text-xs text-slate-500 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {emp.phone}</span>}
                    </div>
                  </div>

                  {/* Masa Kerja */}
                  <div className="flex flex-col">
                     <p className="text-sm font-semibold text-slate-700">{years} Tahun</p>
                     <p className="text-xs text-slate-500">{months} Bulan</p>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 items-center">
                    <Link href={`/employees/${emp.id}`}>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm font-medium h-9 px-4 transition-all">
                        Detail
                      </Button>
                    </Link>
                    {isSuperAdmin && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        onClick={() => {
                          if (confirm(`Yakin ingin menghapus data pegawai "${emp.fullName}"? Data terkait juga akan terdampak.`)) {
                            deleteMutation.mutate(emp.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                </div>
              );
            })}
            
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50/50">
                <Users className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-base font-semibold text-slate-600">Tidak ada data pegawai</p>
                <p className="text-sm mt-1">Gunakan kata kunci atau filter lain untuk mencari.</p>
              </div>
            )}
          </div>
        </div>
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
