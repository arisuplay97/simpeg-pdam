import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Employee, Department } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Clock, Search, Download, AlertTriangle, Users, ChevronRight, FileText } from "lucide-react";

const RETIREMENT_AGE = 58;

type EndInfo = {
  endDate: Date;
  remainDays: number;
  type: "pensiun" | "kontrak";
};

function getEndInfo(emp: Employee): EndInfo | null {
  const now = new Date();

  if (emp.employeeType === "kontrak") {
    if (!emp.contractEndDate) return null;
    const endDate = new Date(emp.contractEndDate);
    const remainDays = Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return { endDate, remainDays, type: "kontrak" };
  }

  if (!emp.birthDate) return null;
  const birth = new Date(emp.birthDate);
  const endDate = new Date(birth.getFullYear() + RETIREMENT_AGE, birth.getMonth(), birth.getDate());
  const remainDays = Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  return { endDate, remainDays, type: "pensiun" };
}

export default function RetirementPage() {
  const [search, setSearch] = useState("");
  const [periodFilter, setPeriodFilter] = useState("1");
  const [typeFilter, setTypeFilter] = useState("all");
  const { toast } = useToast();

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const getDeptName = (id: number | null) => departments.find(d => d.id === id)?.name || "—";

  const maxDays = parseInt(periodFilter) * 365;

  const endingEmployees = employees
    .filter(emp => {
      if (emp.status !== "aktif") return false;
      const info = getEndInfo(emp);
      if (!info) return false;
      if (info.remainDays <= 0 || info.remainDays > maxDays) return false;
      if (typeFilter === "tetap" && emp.employeeType !== "tetap") return false;
      if (typeFilter === "kontrak" && emp.employeeType !== "kontrak") return false;
      return true;
    })
    .map(emp => ({ ...emp, ...getEndInfo(emp)! }))
    .sort((a, b) => a.remainDays - b.remainDays);

  const filtered = endingEmployees.filter(emp =>
    emp.fullName.toLowerCase().includes(search.toLowerCase()) ||
    emp.nip.toLowerCase().includes(search.toLowerCase())
  );

  const urgentCount = endingEmployees.filter(e => e.remainDays <= 90).length;
  const soonCount = endingEmployees.filter(e => e.remainDays <= 365).length;
  const kontrakCount = endingEmployees.filter(e => e.type === "kontrak").length;
  const pensiunCount = endingEmployees.filter(e => e.type === "pensiun").length;

  const exportToExcel = async () => {
    const XLSX = await import("xlsx");
    const data = filtered.map((emp, i) => ({
      "No": i + 1,
      "Nama": emp.fullName,
      "NIK": emp.nip,
      "Tipe": emp.employeeType === "kontrak" ? "Kontrak" : "Tetap",
      "Bagian": getDeptName(emp.departmentId),
      "Keterangan": emp.type === "kontrak" ? "Kontrak Berakhir" : "Pensiun",
      "Tgl Lahir": emp.birthDate ? new Date(emp.birthDate).toLocaleDateString('id-ID') : "—",
      "Tgl Berakhir": emp.endDate.toLocaleDateString('id-ID'),
      "Sisa Hari": emp.remainDays,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [{ wch: 5 }, { wch: 30 }, { wch: 16 }, { wch: 10 }, { wch: 22 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daftar Pensiun & Kontrak");
    XLSX.writeFile(wb, `Daftar_Pensiun_Kontrak_${periodFilter}Tahun.xlsx`);
    toast({ title: "Berhasil", description: "File Excel berhasil diunduh" });
  };

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
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Daftar Pensiun & Kontrak Berakhir</h1>
          <p className="text-sm text-muted-foreground mt-1">Pegawai tetap mendekati pensiun (usia {RETIREMENT_AGE} tahun) dan pegawai kontrak mendekati akhir kontrak</p>
        </div>
        <Button onClick={exportToExcel} variant="outline" className="gap-2" data-testid="btn-export-retirement">
          <Download className="w-4 h-4" /> Export Excel
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-sky-600/10"><Users className="w-5 h-5 text-sky-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total</p>
              <p className="text-xl font-bold" data-testid="text-total-ending">{endingEmployees.length}</p>
              <p className="text-[11px] text-muted-foreground">dalam {periodFilter} tahun</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-amber-500/10"><AlertTriangle className="w-5 h-5 text-amber-500" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Akan Pensiun</p>
              <p className="text-xl font-bold" data-testid="text-pension-count">{pensiunCount}</p>
              <p className="text-[11px] text-muted-foreground">pegawai tetap</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-purple-500/10"><FileText className="w-5 h-5 text-purple-500" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Kontrak Berakhir</p>
              <p className="text-xl font-bold" data-testid="text-contract-count">{kontrakCount}</p>
              <p className="text-[11px] text-muted-foreground">pegawai kontrak</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-red-500/10"><Clock className="w-5 h-5 text-red-500" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">&lt; 3 Bulan</p>
              <p className="text-xl font-bold" data-testid="text-urgent-count">{urgentCount}</p>
              <p className="text-[11px] text-muted-foreground">perlu tindakan segera</p>
            </div>
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
                data-testid="input-search-retirement"
              />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]" data-testid="select-type-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="tetap">Pensiun (Tetap)</SelectItem>
                  <SelectItem value="kontrak">Kontrak Berakhir</SelectItem>
                </SelectContent>
              </Select>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-[160px]" data-testid="select-period-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Dalam 1 Tahun</SelectItem>
                  <SelectItem value="2">Dalam 2 Tahun</SelectItem>
                  <SelectItem value="5">Dalam 5 Tahun</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Nama</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">NIK</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Tipe</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Bagian</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Keterangan</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Tgl Berakhir</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Sisa Hari</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((emp) => {
                  const isUrgent = emp.remainDays <= 90;
                  const isSoon = emp.remainDays <= 365;
                  return (
                    <tr key={emp.id} className="hover:bg-muted/40 transition-colors" data-testid={`retirement-row-${emp.id}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold text-primary">{emp.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                          </div>
                          <span className="font-medium truncate">{emp.fullName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{emp.nip}</td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <Badge variant={emp.employeeType === "kontrak" ? "secondary" : "outline"} className="text-[10px]">
                          {emp.employeeType}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">{getDeptName(emp.departmentId)}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant="outline" className={`text-[10px] ${emp.type === "kontrak" ? "border-purple-500/50 text-purple-600 dark:text-purple-400" : "border-amber-500/50 text-amber-600 dark:text-amber-400"}`}>
                          {emp.type === "kontrak" ? "Kontrak Berakhir" : "Pensiun"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        {emp.endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant={isUrgent ? "destructive" : isSoon ? "default" : "secondary"}
                          className={`text-[11px] ${isSoon && !isUrgent ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}`}
                        >
                          {emp.remainDays} hari
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <Link href={`/employees/${emp.id}`}>
                          <ChevronRight className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer" data-testid={`link-detail-retirement-${emp.id}`} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Clock className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">Tidak ada pegawai ditemukan</p>
                <p className="text-xs mt-1">dalam periode {periodFilter} tahun ke depan</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
