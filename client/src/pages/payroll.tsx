import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Payroll, Employee, PayrollDeduction, Position, Department } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, TrendingDown, Wallet, Search, ChevronDown, ChevronRight, Plus, Trash2, X, FileText, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PayslipModal from "@/components/payslip-modal";

const formatRp = (val: string | number | null) => {
  if (!val) return "Rp 0";
  return `Rp ${Number(val).toLocaleString('id-ID')}`;
};

function DeductionRow({ payrollItem, employees, positions, departments }: { payrollItem: Payroll; employees: Employee[]; positions: Position[]; departments: Department[] }) {
  const [expanded, setExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSlip, setShowSlip] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "direktur";
  const canViewSlip = isAdmin || user?.employeeId === payrollItem.employeeId;

  const emp = employees.find(e => e.id === payrollItem.employeeId);
  const totalAllowance = Number(payrollItem.positionAllowance) + Number(payrollItem.familyAllowance) + Number(payrollItem.transportAllowance) + Number(payrollItem.mealAllowance);

  const { data: deductions = [], isLoading: deductionsLoading } = useQuery<PayrollDeduction[]>({
    queryKey: ["/api/payroll", payrollItem.id, "deductions"],
    queryFn: async () => {
      const res = await fetch(`/api/payroll/${payrollItem.id}/deductions`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch deductions");
      return res.json();
    },
    enabled: expanded || showSlip,
  });

  const addDeduction = useMutation({
    mutationFn: async (data: { label: string; amount: string; description: string }) => {
      await apiRequest("POST", `/api/payroll/${payrollItem.id}/deductions`, {
        type: "custom",
        label: data.label,
        amount: data.amount,
        description: data.description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll", payrollItem.id, "deductions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
      setNewLabel("");
      setNewAmount("");
      setNewDesc("");
      setShowAddForm(false);
    },
  });

  const deleteDeduction = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/payroll-deductions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll", payrollItem.id, "deductions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
    },
  });

  const earningsItems = [
    { label: "Gaji Pokok", amount: payrollItem.basicSalary },
    { label: "Tunjangan Jabatan", amount: payrollItem.positionAllowance },
    { label: "Tunjangan Keluarga", amount: payrollItem.familyAllowance },
    { label: "Tunjangan Transport", amount: payrollItem.transportAllowance },
    { label: "Tunjangan Makan", amount: payrollItem.mealAllowance },
    { label: "Lembur", amount: payrollItem.overtime },
    { label: "Insentif", amount: payrollItem.incentive },
  ].filter(e => Number(e.amount) > 0);

  return (
    <>
      <tr
        className="hover:bg-muted/30 transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        data-testid={`payroll-row-${payrollItem.id}`}
      >
        <td className="px-5 py-3">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
            <div>
              <p className="text-sm font-medium">{emp?.fullName || "—"}</p>
              <p className="text-xs text-muted-foreground">{emp?.nip}</p>
            </div>
          </div>
        </td>
        <td className="px-3 py-3 text-sm">{payrollItem.period}</td>
        <td className="px-3 py-3 text-sm text-right font-mono">{formatRp(payrollItem.basicSalary)}</td>
        <td className="px-3 py-3 text-sm text-right font-mono text-emerald-600">{formatRp(String(totalAllowance))}</td>
        <td className="px-3 py-3 text-sm text-right font-mono text-red-500">{formatRp(payrollItem.totalDeductions)}</td>
        <td className="px-3 py-3 text-sm text-right font-mono font-semibold">{formatRp(payrollItem.netSalary)}</td>
        <td className="px-3 py-3 text-center">
          <Badge variant={payrollItem.status === "final" ? "default" : "secondary"} className="text-[10px]">{payrollItem.status}</Badge>
        </td>
      </tr>
      {expanded && (
        <tr data-testid={`payroll-detail-${payrollItem.id}`}>
          <td colSpan={7} className="px-5 py-0">
            <div className="bg-muted/20 border border-border rounded-lg p-5 my-2">
              {canViewSlip && (
                <div className="flex justify-end mb-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowSlip(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    data-testid={`btn-view-slip-${payrollItem.id}`}
                  >
                    <FileText className="w-3.5 h-3.5" /> Lihat Slip Gaji
                  </button>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Penghasilan
                  </h4>
                  <div className="space-y-2">
                    {earningsItems.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm" data-testid={`earning-item-${i}`}>
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-mono">{formatRp(item.amount)}</span>
                      </div>
                    ))}
                    <div className="border-t border-border pt-2 mt-2 flex justify-between text-sm font-semibold">
                      <span>Total Penghasilan</span>
                      <span className="font-mono text-emerald-600">{formatRp(payrollItem.totalEarnings)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" /> Potongan
                  </h4>
                  {deductionsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-5 w-full" />)}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {deductions.map((d) => (
                        <div key={d.id} className="flex justify-between text-sm items-center" data-testid={`deduction-item-${d.id}`}>
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">{d.label}</span>
                            {d.type === "custom" && isAdmin && (
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteDeduction.mutate(d.id); }}
                                className="text-red-400 hover:text-red-600 transition-colors"
                                data-testid={`btn-delete-deduction-${d.id}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <span className="font-mono text-red-500">- {formatRp(d.amount)}</span>
                        </div>
                      ))}
                      {deductions.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">Tidak ada data potongan</p>
                      )}
                      <div className="border-t border-border pt-2 mt-2 flex justify-between text-sm font-semibold">
                        <span>Total Potongan</span>
                        <span className="font-mono text-red-500">{formatRp(payrollItem.totalDeductions)}</span>
                      </div>
                    </div>
                  )}

                  {isAdmin && !showAddForm && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowAddForm(true); }}
                      className="mt-3 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                      data-testid={`btn-add-deduction-${payrollItem.id}`}
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Potongan Custom
                    </button>
                  )}

                  {showAddForm && (
                    <div className="mt-3 p-3 bg-background border border-border rounded-lg space-y-2" onClick={e => e.stopPropagation()} data-testid={`form-add-deduction-${payrollItem.id}`}>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold">Tambah Potongan</p>
                        <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                      </div>
                      <Input placeholder="Nama potongan" value={newLabel} onChange={e => setNewLabel(e.target.value)} className="h-8 text-xs" data-testid="input-deduction-label" />
                      <Input type="number" placeholder="Jumlah (Rp)" value={newAmount} onChange={e => setNewAmount(e.target.value)} className="h-8 text-xs" data-testid="input-deduction-amount" />
                      <Input placeholder="Keterangan (opsional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} className="h-8 text-xs" data-testid="input-deduction-desc" />
                      <button
                        onClick={() => {
                          if (newLabel && newAmount) {
                            addDeduction.mutate({ label: newLabel, amount: newAmount, description: newDesc });
                          }
                        }}
                        disabled={!newLabel || !newAmount || addDeduction.isPending}
                        className="w-full h-8 bg-primary text-primary-foreground rounded-md text-xs font-medium disabled:opacity-50"
                        data-testid="btn-submit-deduction"
                      >
                        {addDeduction.isPending ? "Menyimpan..." : "Simpan"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t-2 border-primary/30 flex justify-between items-center">
                <span className="text-sm font-bold">Gaji Bersih (Take Home Pay)</span>
                <span className="text-lg font-bold font-mono text-primary" data-testid={`text-net-salary-${payrollItem.id}`}>{formatRp(payrollItem.netSalary)}</span>
              </div>
            </div>
          </td>
        </tr>
      )}
      {showSlip && (
        <PayslipModal
          payrollItem={payrollItem}
          employee={emp}
          deductions={deductions}
          positions={positions}
          departments={departments}
          onClose={() => setShowSlip(false)}
        />
      )}
    </>
  );
}

const BULAN_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function ExportExcelDialog({
  open,
  onClose,
  payrollData,
  employees,
  positions,
  departments,
}: {
  open: boolean;
  onClose: () => void;
  payrollData: Payroll[];
  employees: Employee[];
  positions: Position[];
  departments: Department[];
}) {
  const [expMonth, setExpMonth] = useState(String(new Date().getMonth() + 1));
  const [expYear, setExpYear] = useState(String(new Date().getFullYear()));
  const [expDept, setExpDept] = useState("all");
  const [expStatus, setExpStatus] = useState("all");
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const XLSX = await import("xlsx");

      const periodStr = `${BULAN_NAMES[parseInt(expMonth) - 1]} ${expYear}`;
      const periodFilter = `${expYear}-${expMonth.padStart(2, "0")}`;

      let filtered = payrollData.filter(p => p.period?.startsWith(periodFilter));

      if (expDept !== "all") {
        filtered = filtered.filter(p => {
          const emp = employees.find(e => e.id === p.employeeId);
          return emp?.departmentId === parseInt(expDept);
        });
      }

      if (expStatus !== "all") {
        filtered = filtered.filter(p => {
          const emp = employees.find(e => e.id === p.employeeId);
          return emp?.employeeType === expStatus;
        });
      }

      if (filtered.length === 0) {
        toast({ title: "Tidak ada data", description: "Tidak ada data penggajian untuk filter yang dipilih", variant: "destructive" });
        setExporting(false);
        return;
      }

      const allDeductions: Record<number, any[]> = {};
      await Promise.all(
        filtered.map(async (p) => {
          try {
            const res = await fetch(`/api/payroll/${p.id}/deductions`, { credentials: "include" });
            if (res.ok) allDeductions[p.id] = await res.json();
          } catch { /* skip */ }
        })
      );

      const rows: any[][] = [];

      rows.push(["REKAPITULASI GAJI PDAM TIRTA ARDHIA RINJANI"]);
      rows.push([`Periode: ${periodStr}`]);
      rows.push([]);

      const headers = [
        "No", "NIP", "Nama", "Bagian", "Jabatan", "Status",
        "Gaji Pokok", "Tunj. Jabatan", "Tunj. Keluarga",
        "Tunj. Transport", "Tunj. Makan", "Lembur", "Insentif",
        "Total Penghasilan",
        "BPJS Kesehatan", "BPJS Ketenagakerjaan",
        "Iuran Pensiun", "Koperasi", "Pinjaman", "PPh21",
        "Total Potongan",
        "GAJI BERSIH",
      ];
      rows.push(headers);

      const totals = new Array(headers.length).fill(0);

      filtered.forEach((p, idx) => {
        const emp = employees.find(e => e.id === p.employeeId);
        const pos = positions.find(ps => ps.id === emp?.positionId);
        const dept = departments.find(d => d.id === emp?.departmentId);
        const deds = allDeductions[p.id] || [];

        const findDed = (type: string) => {
          const d = deds.find((dd: any) => dd.type === type);
          return d ? Number(d.amount) : 0;
        };

        const gajiPokok = Number(p.basicSalary);
        const tunjJabatan = Number(p.positionAllowance);
        const tunjKeluarga = Number(p.familyAllowance);
        const tunjTransport = Number(p.transportAllowance);
        const tunjMakan = Number(p.mealAllowance);
        const lembur = Number(p.overtime);
        const insentif = Number(p.incentive);
        const totalPenghasilan = Number(p.totalEarnings);

        const bpjsKes = findDed("bpjs_kesehatan");
        const bpjsTk = findDed("bpjs_ketenagakerjaan");
        const pensiun = findDed("iuran_pensiun");
        const koperasi = findDed("koperasi");
        const pinjaman = findDed("pinjaman");
        const pph21 = findDed("pph21");
        const totalPotongan = Number(p.totalDeductions);
        const gajiBersih = Number(p.netSalary);

        const row = [
          idx + 1,
          emp?.nip || "",
          emp?.fullName || "",
          dept?.name || "",
          pos?.name || "",
          emp?.employeeType || "",
          gajiPokok, tunjJabatan, tunjKeluarga,
          tunjTransport, tunjMakan, lembur, insentif,
          totalPenghasilan,
          bpjsKes, bpjsTk,
          pensiun, koperasi, pinjaman, pph21,
          totalPotongan,
          gajiBersih,
        ];
        rows.push(row);

        for (let c = 6; c < row.length; c++) {
          totals[c] = (totals[c] || 0) + (Number(row[c]) || 0);
        }
      });

      const totalRow = new Array(headers.length).fill("");
      totalRow[0] = "";
      totalRow[1] = "";
      totalRow[2] = "TOTAL";
      for (let c = 6; c < headers.length; c++) {
        totalRow[c] = totals[c];
      }
      rows.push(totalRow);

      const ws = XLSX.utils.aoa_to_sheet(rows);

      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
      ];

      const colWidths = headers.map((h, i) => {
        if (i === 0) return { wch: 4 };
        if (i === 1) return { wch: 14 };
        if (i === 2) return { wch: 25 };
        if (i === 3) return { wch: 18 };
        if (i === 4) return { wch: 20 };
        if (i === 5) return { wch: 10 };
        return { wch: 16 };
      });
      ws["!cols"] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Rekap Gaji");
      XLSX.writeFile(wb, `Rekap_Gaji_${periodStr.replace(" ", "_")}.xlsx`);

      const deptName = expDept === "all" ? "Semua" : departments.find(d => d.id === parseInt(expDept))?.name || expDept;
      const statusName = expStatus === "all" ? "Semua" : expStatus;
      await apiRequest("POST", "/api/export-logs", {
        exportType: "payroll_excel",
        period: periodStr,
        filters: JSON.stringify({ department: deptName, status: statusName, count: filtered.length }),
      });

      toast({ title: "Export Berhasil", description: `File Excel berhasil diunduh (${filtered.length} data)` });
      onClose();
    } catch (err: any) {
      toast({ title: "Export Gagal", description: err.message || "Terjadi kesalahan", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }, [expMonth, expYear, expDept, expStatus, payrollData, employees, positions, departments, onClose, toast]);

  if (!open) return null;

  const years: string[] = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 2; y <= currentYear + 1; y++) years.push(String(y));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 p-6"
        onClick={e => e.stopPropagation()}
        data-testid="dialog-export-excel"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">Export Excel Penggajian</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" data-testid="btn-close-export">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Bulan</label>
              <Select value={expMonth} onValueChange={setExpMonth}>
                <SelectTrigger data-testid="select-export-month"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BULAN_NAMES.map((b, i) => (
                    <SelectItem key={i} value={String(i + 1)}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tahun</label>
              <Select value={expYear} onValueChange={setExpYear}>
                <SelectTrigger data-testid="select-export-year"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Bagian / Divisi</label>
            <Select value={expDept} onValueChange={setExpDept}>
              <SelectTrigger data-testid="select-export-dept"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Bagian</SelectItem>
                {departments.map(d => (
                  <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status Pegawai</label>
            <Select value={expStatus} onValueChange={setExpStatus}>
              <SelectTrigger data-testid="select-export-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="tetap">Tetap</SelectItem>
                <SelectItem value="kontrak">Kontrak</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
            data-testid="btn-cancel-export"
          >
            Batal
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 h-10 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            data-testid="btn-confirm-export"
          >
            <Download className="w-4 h-4" />
            {exporting ? "Mengunduh..." : "Export Excel"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PayrollPage() {
  const [search, setSearch] = useState("");
  const [showExport, setShowExport] = useState(false);
  const { user } = useAuth();
  const canExport = user?.role === "admin" || user?.role === "direktur";

  const { data: payrollData = [], isLoading } = useQuery<Payroll[]>({
    queryKey: ["/api/payroll"],
  });
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });
  const { data: positions = [] } = useQuery<Position[]>({
    queryKey: ["/api/positions"],
  });
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const totalGross = payrollData.reduce((s, p) => s + Number(p.totalEarnings), 0);
  const totalDeductions = payrollData.reduce((s, p) => s + Number(p.totalDeductions), 0);
  const totalNet = payrollData.reduce((s, p) => s + Number(p.netSalary), 0);

  const filtered = payrollData.filter(p => {
    const emp = employees.find(e => e.id === p.employeeId);
    return !search || emp?.fullName.toLowerCase().includes(search.toLowerCase()) || emp?.nip.toLowerCase().includes(search.toLowerCase());
  });

  const salaryDistribution = (() => {
    const ranges = [
      { name: "< 5 Jt", min: 0, max: 5000000, count: 0 },
      { name: "5-7 Jt", min: 5000000, max: 7000000, count: 0 },
      { name: "7-10 Jt", min: 7000000, max: 10000000, count: 0 },
      { name: "> 10 Jt", min: 10000000, max: Infinity, count: 0 },
    ];
    payrollData.forEach(p => {
      const net = Number(p.netSalary);
      const range = ranges.find(r => net >= r.min && net < r.max);
      if (range) range.count++;
    });
    return ranges;
  })();

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Penggajian</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola slip gaji dan komponen penggajian pegawai — klik baris untuk melihat rincian</p>
        </div>
        {canExport && (
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
            data-testid="btn-export-excel"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Pendapatan</p><p className="text-xl font-bold mt-1">{formatRp(String(totalGross))}</p></div>
            <div className="p-2.5 rounded-xl bg-emerald-600/10"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Potongan</p><p className="text-xl font-bold mt-1">{formatRp(String(totalDeductions))}</p></div>
            <div className="p-2.5 rounded-xl bg-red-500/10"><TrendingDown className="w-5 h-5 text-red-500" /></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Gaji Bersih</p><p className="text-xl font-bold mt-1 text-primary">{formatRp(String(totalNet))}</p></div>
            <div className="p-2.5 rounded-xl bg-sky-600/10"><Wallet className="w-5 h-5 text-sky-600" /></div>
          </div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Distribusi Gaji</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={salaryDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#0284c7" name="Pegawai" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Cari pegawai..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" data-testid="input-search-payroll" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Pegawai</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">Periode</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-3 py-3">Gaji Pokok</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-3 py-3">Tunjangan</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-3 py-3">Potongan</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-3 py-3">Gaji Bersih</th>
                  <th className="text-center text-xs font-medium text-muted-foreground px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => (
                  <DeductionRow key={p.id} payrollItem={p} employees={employees} positions={positions} departments={departments} />
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <DollarSign className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Tidak ada data payroll</p>
            </div>
          )}
        </CardContent>
      </Card>

      {canExport && (
        <ExportExcelDialog
          open={showExport}
          onClose={() => setShowExport(false)}
          payrollData={payrollData}
          employees={employees}
          positions={positions}
          departments={departments}
        />
      )}
    </div>
  );
}
