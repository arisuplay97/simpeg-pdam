import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Branch, Department, SubDepartment, Employee } from "@shared/schema";

export default function MasterDataPage() {
  const { toast } = useToast();
  
  // Data Fetching
  const { data: branches = [], isLoading: loadBranches } = useQuery<Branch[]>({ queryKey: ["/api/branches"] });
  const { data: departments = [], isLoading: loadDepts } = useQuery<Department[]>({ queryKey: ["/api/departments"] });
  const { data: subDepartments = [], isLoading: loadSubDepts } = useQuery<SubDepartment[]>({ queryKey: ["/api/sub-departments"] });
  const { data: employees = [], isLoading: loadEmps } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });

  // Modals state
  const [branchModal, setBranchModal] = useState({ open: false, data: null as Branch | null });
  const [deptModal, setDeptModal] = useState({ open: false, data: null as Department | null });
  const [subDeptModal, setSubDeptModal] = useState({ open: false, data: null as SubDepartment | null });
  const [deleteModal, setDeleteModal] = useState<{ open: false } | { open: true, type: string, id: number }>({ open: false });

  // Helpers
  const getEmployeeName = (id: number | null) => employees.find((e) => e.id === id)?.fullName || "-";
  const getDeptName = (id: number | null) => departments.find((d) => d.id === id)?.name || "-";
  const getBranchName = (id: number | null) => branches.find((b) => b.id === id)?.name || "-";

  // Actions
  const handleSaveBranch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    
    // Convert headId empty string to null or number
    // Convert headId empty string or "none" to null or number
    const finalPayload = {
      ...payload,
      headId: payload.headId && payload.headId !== "none" ? parseInt(payload.headId as string, 10) : null
    };

    try {
      if (branchModal.data) {
        await apiRequest("PUT", `/api/branches/${branchModal.data.id}`, finalPayload);
        toast({ title: "Berhasil diperbarui" });
      } else {
        await apiRequest("POST", `/api/branches`, finalPayload);
        toast({ title: "Berhasil ditambahkan" });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      setBranchModal({ open: false, data: null });
    } catch (error: any) {
      toast({ title: "Gagal menyimpan", description: error.message, variant: "destructive" });
    }
  };

  const handleSaveDept = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    const finalPayload = {
      ...payload,
      managerId: payload.managerId && payload.managerId !== "none" ? parseInt(payload.managerId as string, 10) : null
    };

    try {
      if (deptModal.data) {
        await apiRequest("PUT", `/api/departments/${deptModal.data.id}`, finalPayload);
      } else {
        await apiRequest("POST", `/api/departments`, finalPayload);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setDeptModal({ open: false, data: null });
      toast({ title: "Tersimpan" });
    } catch (error: any) {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    }
  };

  const handleSaveSubDept = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    
    // We can't rely just on payload.parentType because the user might have selected something
    // from the <select> but forgot to change the parentType Select mapping. 
    // It's safer to check if the ID exists in branches or departments.
    const rawParentId = payload.parentId ? parseInt(payload.parentId as string, 10) : null;
    
    if (!rawParentId) {
      toast({ title: "Induk wajib dipilih", variant: "destructive" });
      return;
    }

    // Determine if the selected ID is a branch or department based on the UI grouping
    // Since IDs might overlap between tables, we MUST rely on the parentType payload from the Select.
    // However, Radix Select doesn't submit FormData natively unless we use a hidden input or controlled state.
    // In our code, <Select name="parentType"> creates a hidden input which submits perfectly.
    const parentType = payload.parentType; 

    // Now correctly assign the ID to the appropriate column.
    const finalPayload = {
      name: payload.name,
      departmentId: parentType === "pusat" ? rawParentId : null,
      branchId: parentType === "cabang" ? rawParentId : null,
      managerId: payload.managerId && payload.managerId !== "none" ? parseInt(payload.managerId as string, 10) : null
    };

    try {
      if (subDeptModal.data) {
        await apiRequest("PUT", `/api/sub-departments/${subDeptModal.data.id}`, finalPayload);
      } else {
        await apiRequest("POST", `/api/sub-departments`, finalPayload);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/sub-departments"] });
      setSubDeptModal({ open: false, data: null });
      toast({ title: "Tersimpan" });
    } catch (error: any) {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.open) return;
    try {
      await apiRequest("DELETE", `/api/${deleteModal.type}/${deleteModal.id}`);
      queryClient.invalidateQueries({ queryKey: [`/api/${deleteModal.type}`] });
      setDeleteModal({ open: false });
      toast({ title: "Data berhasil dihapus" });
    } catch (error: any) {
      toast({ title: "Gagal menghapus", description: error.message, variant: "destructive" });
      setDeleteModal({ open: false });
    }
  };

  if (loadBranches || loadDepts || loadSubDepts || loadEmps) {
    return <div>Memuat data...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Master Data</h1>
        <p className="text-muted-foreground mt-1 text-sm bg-yellow-500/10 p-3 rounded-md border border-yellow-500/20">
          Halaman ini digunakan untuk mengelola data master struktural PDAM: <b>Cabang</b>, <b>Bidang (Pusat)</b>, dan <b>Sub-Bidang</b> beserta Kepala yang diembannya.
        </p>
      </div>

      <Tabs defaultValue="branches" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="branches">Kantor Cabang</TabsTrigger>
          <TabsTrigger value="departments">Bidang (Pusat)</TabsTrigger>
          <TabsTrigger value="subdepartments">Sub-Bidang</TabsTrigger>
        </TabsList>

        <TabsContent value="branches" className="space-y-4">
          <div className="flex justify-between items-center bg-card p-4 rounded-xl border">
            <h2 className="font-semibold text-lg">Daftar Kantor Cabang</h2>
            <Button onClick={() => setBranchModal({ open: true, data: null })}>
              <Plus className="w-4 h-4 mr-2" /> Tambah Cabang
            </Button>
          </div>
          <div className="rounded-xl border bg-card overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Nama Cabang</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Kepala Cabang</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map(branch => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-medium text-primary">{branch.name}</TableCell>
                    <TableCell className="text-muted-foreground">{branch.address}</TableCell>
                    <TableCell>{branch.phone}</TableCell>
                    <TableCell>{getEmployeeName(branch.headId)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => setBranchModal({ open: true, data: branch })}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600" onClick={() => setDeleteModal({ open: true, type: 'branches', id: branch.id })}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <div className="flex justify-between items-center bg-card p-4 rounded-xl border">
            <h2 className="font-semibold text-lg">Daftar Bidang (Kantor Pusat)</h2>
            <Button onClick={() => setDeptModal({ open: true, data: null })}>
              <Plus className="w-4 h-4 mr-2" /> Tambah Bidang
            </Button>
          </div>
          <div className="rounded-xl border bg-card overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Bidang</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Kepala Bidang (Kabid)</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell><span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-semibold">{dept.code}</span></TableCell>
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell className="text-muted-foreground">{dept.description}</TableCell>
                    <TableCell>{getEmployeeName(dept.managerId)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => setDeptModal({ open: true, data: dept })}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600" onClick={() => setDeleteModal({ open: true, type: 'departments', id: dept.id })}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="subdepartments" className="space-y-4">
          <div className="flex justify-between items-center bg-card p-4 rounded-xl border">
            <h2 className="font-semibold text-lg">Sub-Bidang / Bagian (Pusat & Cabang)</h2>
            <Button onClick={() => setSubDeptModal({ open: true, data: null })}>
              <Plus className="w-4 h-4 mr-2" /> Tambah Sub-Bidang
            </Button>
          </div>
          <div className="rounded-xl border bg-card overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Nama Sub-Bidang / Bagian</TableHead>
                  <TableHead>Induk (Pusat / Cabang)</TableHead>
                  <TableHead>Kepala Sub-Bidang (Kasubbid)</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subDepartments.map(sub => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.name}</TableCell>
                    <TableCell>
                      {sub.departmentId ? (
                        <span className="bg-blue-500/10 text-blue-600 px-2 py-1 rounded-md text-xs">Pusat : {getDeptName(sub.departmentId)}</span>
                      ) : (
                        <span className="bg-green-500/10 text-green-600 px-2 py-1 rounded-md text-xs">Cabang : {getBranchName(sub.branchId)}</span>
                      )}
                    </TableCell>
                    <TableCell>{getEmployeeName(sub.managerId)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => setSubDeptModal({ open: true, data: sub })}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600" onClick={() => setDeleteModal({ open: true, type: 'sub-departments', id: sub.id })}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* --- MODALS --- */}

      {/* BRANCH MODAL */}
      <Dialog open={branchModal.open} onOpenChange={(open) => !open && setBranchModal({ open: false, data: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{branchModal.data ? "Edit Cabang" : "Tambah Cabang Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveBranch} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nama Cabang</Label>
              <Input name="name" defaultValue={branchModal.data?.name || ""} required placeholder="Misal: Cabang Praya" />
            </div>
            <div className="space-y-2">
              <Label>Alamat</Label>
              <Textarea name="address" defaultValue={branchModal.data?.address || ""} required />
            </div>
            <div className="space-y-2">
              <Label>No Telepon</Label>
              <Input name="phone" defaultValue={branchModal.data?.phone || ""} />
            </div>
            <div className="space-y-2">
              <Label>Kepala Cabang</Label>
              <Select name="headId" defaultValue={branchModal.data?.headId?.toString() || "none"}>
                <SelectTrigger><SelectValue placeholder="Pilih Pegawai (Opsional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Belum Ditentukan --</SelectItem>
                  {employees.filter(e => e.officeType === "cabang" && e.structuralPosition === "kepala_cabang").map(e => (
                    <SelectItem key={e.id} value={e.id.toString()}>{e.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Opsi hanya menampilkan pegawai berjabatan Kepala Cabang.</p>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setBranchModal({ open: false, data: null })}>Batal</Button>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DEPT MODAL */}
      <Dialog open={deptModal.open} onOpenChange={(open) => !open && setDeptModal({ open: false, data: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{deptModal.data ? "Edit Bidang (Pusat)" : "Tambah Bidang (Pusat)"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveDept} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Kode Bidang</Label>
              <Input name="code" defaultValue={deptModal.data?.code || ""} required />
            </div>
            <div className="space-y-2">
              <Label>Nama Bidang</Label>
              <Input name="name" defaultValue={deptModal.data?.name || ""} required />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea name="description" defaultValue={deptModal.data?.description || ""} />
            </div>
            <div className="space-y-2">
              <Label>Kepala Bidang (Kabid)</Label>
              <Select name="managerId" defaultValue={deptModal.data?.managerId?.toString() || "none"}>
                <SelectTrigger><SelectValue placeholder="Pilih Pegawai (Opsional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Belum Ditentukan --</SelectItem>
                  {employees.filter(e => e.structuralPosition === "kabid").map(e => (
                    <SelectItem key={e.id} value={e.id.toString()}>{e.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setDeptModal({ open: false, data: null })}>Batal</Button>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* SUB DEPT MODAL */}
      <Dialog open={subDeptModal.open} onOpenChange={(open) => !open && setSubDeptModal({ open: false, data: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{subDeptModal.data ? "Edit Sub-Bidang" : "Tambah Sub-Bidang"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveSubDept} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nama Sub-Bidang / Bagian</Label>
              <Input name="name" defaultValue={subDeptModal.data?.name || ""} required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Induk Lokasi</Label>
                <Select name="parentType" defaultValue={subDeptModal.data?.departmentId ? "pusat" : "cabang"}>
                  <SelectTrigger><SelectValue placeholder="Pilih Lokasi" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pusat">Kantor Pusat</SelectItem>
                    <SelectItem value="cabang">Kantor Cabang</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* A bit of React trickery since we only capture FormData on submit */}
              <div className="space-y-2">
                <Label>Pilih Induk (Bidang/Cabang)</Label>
                <select name="parentId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" required defaultValue={subDeptModal.data?.departmentId?.toString() || subDeptModal.data?.branchId?.toString() || ""}>
                  <option value="" disabled>-- Pilih --</option>
                  <optgroup label="Pilih Lokasi Induk (Filter berdasarkan 'Induk Lokasi')">
                    {/* We filter options dynamically via JS normally, but for a simple non-controlled form, 
                        we render all and trust the user to select the right group corresponding to parentType. */}
                  </optgroup>
                  <optgroup label="Kantor Pusat (Bidang)">
                    {departments.map(d => <option key={`d-${d.id}`} value={d.id}>{d.name}</option>)}
                  </optgroup>
                  <optgroup label="Kantor Cabang">
                    {branches.map(b => <option key={`b-${b.id}`} value={b.id}>{b.name}</option>)}
                  </optgroup>
                </select>
                <p className="text-xs text-muted-foreground mt-1">Pastikan pilihan sejalan dengan Induk Lokasi di atasnya.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Kepala Sub-Bidang (Kasubbid)</Label>
              <Select name="managerId" defaultValue={subDeptModal.data?.managerId?.toString() || "none"}>
                <SelectTrigger><SelectValue placeholder="Pilih Pegawai (Opsional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Belum Ditentukan --</SelectItem>
                  {employees.filter(e => e.structuralPosition === "kasubbid").map(e => (
                    <SelectItem key={e.id} value={e.id.toString()}>{e.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setSubDeptModal({ open: false, data: null })}>Batal</Button>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM */}
      <Dialog open={deleteModal.open} onOpenChange={(o) => !o && setDeleteModal({ open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <p>Yakin ingin menghapus data ini? Aksi ini mungkin gagal jika data cabang atau bidang sedang dipakai oleh pegawai.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModal({ open: false })}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus Data</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
