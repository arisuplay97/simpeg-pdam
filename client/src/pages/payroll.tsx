import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Payroll, Employee, PayrollDeduction, Position, Department, Branch } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, TrendingDown, Wallet, Search, ChevronDown, ChevronRight, Plus, Trash2, X, FileText, Download, Pencil, CalendarDays, Users } from "lucide-react";
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
  const [showEdit, setShowEdit] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "direktur" || user?.role === "superadmin";
  const canViewSlip = isAdmin || user?.employeeId === payrollItem.employeeId;

  const { toast } = useToast();

  const deletePayroll = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/payroll/${payrollItem.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
      toast({ title: "Berhasil", description: "Data penggajian berhasil dihapus" });
    },
    onError: (err: any) => {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    },
  });

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
              <div className="flex justify-end gap-2 mb-3">
                {isAdmin && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowEdit(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                    data-testid={`btn-edit-payroll-${payrollItem.id}`}
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Yakin ingin menghapus data penggajian ini?")) {
                        deletePayroll.mutate();
                      }
                    }}
                    disabled={deletePayroll.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                    data-testid={`btn-delete-payroll-${payrollItem.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> {deletePayroll.isPending ? "Menghapus..." : "Hapus"}
                  </button>
                )}
                {canViewSlip && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowSlip(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    data-testid={`btn-view-slip-${payrollItem.id}`}
                  >
                    <FileText className="w-3.5 h-3.5" /> Lihat Slip Gaji
                  </button>
                )}
              </div>
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
      {showEdit && (
        <EditPayrollDialog
          payrollItem={payrollItem}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  );
}

function EditPayrollDialog({
  payrollItem,
  onClose,
}: {
  payrollItem: Payroll;
  onClose: () => void;
}) {
  const [period, setPeriod] = useState(payrollItem.period);
  const [basicSalary, setBasicSalary] = useState(String(Number(payrollItem.basicSalary)));
  const [positionAllowance, setPositionAllowance] = useState(String(Number(payrollItem.positionAllowance)));
  const [familyAllowance, setFamilyAllowance] = useState(String(Number(payrollItem.familyAllowance)));
  const [transportAllowance, setTransportAllowance] = useState(String(Number(payrollItem.transportAllowance)));
  const [mealAllowance, setMealAllowance] = useState(String(Number(payrollItem.mealAllowance)));
  const [overtime, setOvertime] = useState(String(Number(payrollItem.overtime)));
  const [incentive, setIncentive] = useState(String(Number(payrollItem.incentive)));
  const [status, setStatus] = useState(payrollItem.status);
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("PUT", `/api/payroll/${payrollItem.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
      toast({ title: "Berhasil", description: "Data penggajian berhasil diperbarui" });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    const basic = Number(basicSalary);
    const posAllow = Number(positionAllowance);
    const famAllow = Number(familyAllowance);
    const transAllow = Number(transportAllowance);
    const mealAllow = Number(mealAllowance);
    const ot = Number(overtime);
    const inc = Number(incentive);
    const totalEarnings = basic + posAllow + famAllow + transAllow + mealAllow + ot + inc;

    const bpjsKes = Math.round(basic * 0.01 * 100) / 100;
    const bpjsTk = Math.round(basic * 0.05 * 100) / 100;
    const pension = Math.round(basic * 0.01 * 100) / 100;
    const pph21 = Math.round(basic * 0.05 * 100) / 100;
    const totalDeductions = bpjsKes + bpjsTk + pension + pph21;
    const netSalary = totalEarnings - totalDeductions;

    updateMutation.mutate({
      period,
      basicSalary: String(basic),
      positionAllowance: String(posAllow),
      familyAllowance: String(famAllow),
      transportAllowance: String(transAllow),
      mealAllowance: String(mealAllow),
      overtime: String(ot),
      incentive: String(inc),
      bpjsKesehatanDeduction: String(bpjsKes),
      bpjsKetenagakerjaanDeduction: String(bpjsTk),
      pensionDeduction: String(pension),
      pph21Deduction: String(pph21),
      totalEarnings: String(totalEarnings),
      totalDeductions: String(totalDeductions),
      netSalary: String(netSalary),
      status,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        data-testid="dialog-edit-payroll"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">Edit Penggajian</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" data-testid="btn-close-edit-payroll">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Periode (YYYY-MM)</label>
              <Input value={period} onChange={e => setPeriod(e.target.value)} data-testid="input-edit-period" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger data-testid="select-edit-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Gaji Pokok</label>
              <Input type="number" value={basicSalary} onChange={e => setBasicSalary(e.target.value)} data-testid="input-edit-basic" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tunj. Jabatan</label>
              <Input type="number" value={positionAllowance} onChange={e => setPositionAllowance(e.target.value)} data-testid="input-edit-position-allowance" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tunj. Keluarga</label>
              <Input type="number" value={familyAllowance} onChange={e => setFamilyAllowance(e.target.value)} data-testid="input-edit-family-allowance" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tunj. Transport</label>
              <Input type="number" value={transportAllowance} onChange={e => setTransportAllowance(e.target.value)} data-testid="input-edit-transport" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tunj. Makan</label>
              <Input type="number" value={mealAllowance} onChange={e => setMealAllowance(e.target.value)} data-testid="input-edit-meal" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Lembur</label>
              <Input type="number" value={overtime} onChange={e => setOvertime(e.target.value)} data-testid="input-edit-overtime" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Insentif</label>
            <Input type="number" value={incentive} onChange={e => setIncentive(e.target.value)} data-testid="input-edit-incentive" />
          </div>

          <p className="text-[11px] text-muted-foreground italic">Potongan BPJS Kes (1%), BPJS TK (5%), Iuran Pensiun (1%), PPh21 (5%) dihitung ulang otomatis dari Gaji Pokok.</p>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 h-10 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors" data-testid="btn-cancel-edit-payroll">
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="flex-1 h-10 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
            data-testid="btn-submit-edit-payroll"
          >
            {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function AddPayrollDialog({
  open,
  onClose,
  employees,
}: {
  open: boolean;
  onClose: () => void;
  employees: Employee[];
}) {
  const [empId, setEmpId] = useState("");
  const [period, setPeriod] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`);
  const [basicSalary, setBasicSalary] = useState("");
  const [positionAllowance, setPositionAllowance] = useState("0");
  const [familyAllowance, setFamilyAllowance] = useState("0");
  const [transportAllowance, setTransportAllowance] = useState("500000");
  const [mealAllowance, setMealAllowance] = useState("300000");
  const [overtime, setOvertime] = useState("0");
  const [incentive, setIncentive] = useState("0");
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/payroll", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
      toast({ title: "Berhasil", description: "Data penggajian berhasil ditambahkan" });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!empId || !basicSalary) {
      toast({ title: "Error", description: "Pegawai dan Gaji Pokok wajib diisi", variant: "destructive" });
      return;
    }
    const basic = Number(basicSalary);
    const posAllow = Number(positionAllowance);
    const famAllow = Number(familyAllowance);
    const transAllow = Number(transportAllowance);
    const mealAllow = Number(mealAllowance);
    const ot = Number(overtime);
    const inc = Number(incentive);
    const totalEarnings = basic + posAllow + famAllow + transAllow + mealAllow + ot + inc;

    const bpjsKes = Math.round(basic * 0.01 * 100) / 100;
    const bpjsTk = Math.round(basic * 0.05 * 100) / 100;
    const pension = Math.round(basic * 0.01 * 100) / 100;
    const pph21 = Math.round(basic * 0.05 * 100) / 100;
    const totalDeductions = bpjsKes + bpjsTk + pension + pph21;
    const netSalary = totalEarnings - totalDeductions;

    createMutation.mutate({
      employeeId: parseInt(empId),
      period,
      basicSalary: String(basic),
      positionAllowance: String(posAllow),
      familyAllowance: String(famAllow),
      transportAllowance: String(transAllow),
      mealAllowance: String(mealAllow),
      overtime: String(ot),
      incentive: String(inc),
      bpjsKesehatanDeduction: String(bpjsKes),
      bpjsKetenagakerjaanDeduction: String(bpjsTk),
      pensionDeduction: String(pension),
      pph21Deduction: String(pph21),
      loanDeduction: "0",
      cooperativeDeduction: "0",
      disciplineDeduction: "0",
      totalEarnings: String(totalEarnings),
      totalDeductions: String(totalDeductions),
      netSalary: String(netSalary),
      status: "draft",
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        data-testid="dialog-add-payroll"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">Tambah Penggajian</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" data-testid="btn-close-add-payroll">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Pegawai</label>
            <Select value={empId} onValueChange={setEmpId}>
              <SelectTrigger data-testid="select-payroll-employee"><SelectValue placeholder="Pilih Pegawai" /></SelectTrigger>
              <SelectContent>
                {employees.map(e => (
                  <SelectItem key={e.id} value={String(e.id)}>{e.nip} - {e.fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Periode (YYYY-MM)</label>
            <Input value={period} onChange={e => setPeriod(e.target.value)} placeholder="2026-03" data-testid="input-payroll-period" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Gaji Pokok</label>
              <Input type="number" value={basicSalary} onChange={e => setBasicSalary(e.target.value)} placeholder="5000000" data-testid="input-payroll-basic" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tunj. Jabatan</label>
              <Input type="number" value={positionAllowance} onChange={e => setPositionAllowance(e.target.value)} data-testid="input-payroll-position-allowance" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tunj. Keluarga</label>
              <Input type="number" value={familyAllowance} onChange={e => setFamilyAllowance(e.target.value)} data-testid="input-payroll-family-allowance" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tunj. Transport</label>
              <Input type="number" value={transportAllowance} onChange={e => setTransportAllowance(e.target.value)} data-testid="input-payroll-transport" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tunj. Makan</label>
              <Input type="number" value={mealAllowance} onChange={e => setMealAllowance(e.target.value)} data-testid="input-payroll-meal" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Lembur</label>
              <Input type="number" value={overtime} onChange={e => setOvertime(e.target.value)} data-testid="input-payroll-overtime" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Insentif</label>
            <Input type="number" value={incentive} onChange={e => setIncentive(e.target.value)} data-testid="input-payroll-incentive" />
          </div>

          <p className="text-[11px] text-muted-foreground italic">Potongan BPJS Kes (1%), BPJS TK (5%), Iuran Pensiun (1%), PPh21 (5%) dihitung otomatis dari Gaji Pokok.</p>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 h-10 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors" data-testid="btn-cancel-add-payroll">
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            data-testid="btn-submit-payroll"
          >
            {createMutation.isPending ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
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
  branches,
}: {
  open: boolean;
  onClose: () => void;
  payrollData: Payroll[];
  employees: Employee[];
  positions: Position[];
  departments: Department[];
  branches: Branch[];
}) {
  const [expMonth, setExpMonth] = useState(String(new Date().getMonth() + 1));
  const [expYear, setExpYear] = useState(String(new Date().getFullYear()));
  const [expOffice, setExpOffice] = useState("all");
  const [expBranch, setExpBranch] = useState("all");
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

      if (expOffice !== "all") {
        filtered = filtered.filter(p => {
          const emp = employees.find(e => e.id === p.employeeId);
          return emp?.officeType === expOffice;
        });
      }

      if (expOffice === "cabang" && expBranch !== "all") {
        filtered = filtered.filter(p => {
          const emp = employees.find(e => e.id === p.employeeId);
          return emp?.branchId === parseInt(expBranch);
        });
      }

      if (expOffice === "pusat" && expDept !== "all") {
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
        "No", "NIK", "Nama", "Bagian", "Jabatan", "Status",
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
  }, [expMonth, expYear, expOffice, expBranch, expDept, expStatus, payrollData, employees, positions, departments, branches, onClose, toast]);

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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Lokasi Kantor</label>
              <Select value={expOffice} onValueChange={v => { setExpOffice(v); setExpBranch("all"); setExpDept("all"); }}>
                <SelectTrigger data-testid="select-export-office"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Lokasi</SelectItem>
                  <SelectItem value="pusat">Kantor Pusat</SelectItem>
                  <SelectItem value="cabang">Kantor Cabang</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {expOffice === "cabang" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Cabang</label>
                <Select value={expBranch} onValueChange={setExpBranch}>
                  <SelectTrigger data-testid="select-export-branch"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Cabang</SelectItem>
                    {branches.map(b => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {expOffice === "pusat" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Bagian Pusat</label>
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
            )}
            {expOffice === "all" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Bagian / Cabang</label>
                <Input value="Pilih Lokasi Dahulu" disabled className="text-xs text-muted-foreground h-10" />
              </div>
            )}
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

const BULAN_LABELS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

export default function PayrollPage() {
  const now = new Date();
  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState(String(now.getMonth() + 1));
  const [filterYear, setFilterYear] = useState(String(now.getFullYear()));
  const [filterOffice, setFilterOffice] = useState("all");
  const [filterBranch, setFilterBranch] = useState("all");
  const [showExport, setShowExport] = useState(false);
  const [showAddPayroll, setShowAddPayroll] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "direktur" || user?.role === "superadmin";
  const canExport = isAdmin;

  const filterYears: string[] = [];
  for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) filterYears.push(String(y));

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
  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["/api/branches"],
  });

  const periodKey = `${filterYear}-${filterMonth.padStart(2, '0')}`;
  let periodFiltered = payrollData.filter(p => p.period === periodKey);

  if (filterOffice !== "all") {
    periodFiltered = periodFiltered.filter(p => {
      const emp = employees.find(e => e.id === p.employeeId);
      return emp?.officeType === filterOffice;
    });
  }

  if (filterOffice === "cabang" && filterBranch !== "all") {
    periodFiltered = periodFiltered.filter(p => {
      const emp = employees.find(e => e.id === p.employeeId);
      return emp?.branchId === parseInt(filterBranch);
    });
  }

  const totalGross = periodFiltered.reduce((s, p) => s + Number(p.totalEarnings), 0);
  const totalDeductions = periodFiltered.reduce((s, p) => s + Number(p.totalDeductions), 0);
  const totalNet = periodFiltered.reduce((s, p) => s + Number(p.netSalary), 0);

  const paidCount = periodFiltered.length;
  const avgNet = paidCount > 0 ? totalNet / paidCount : 0;

  const filtered = periodFiltered.filter(p => {
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
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowAddPayroll(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
              data-testid="btn-add-payroll"
            >
              <Plus className="w-4 h-4" />
              Tambah
            </button>
          )}
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
      </div>

      {/* Period Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Periode:</span>
            </div>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-[140px]" data-testid="select-payroll-month">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BULAN_LABELS.map((b, i) => (
                  <SelectItem key={i} value={String(i + 1)}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-[100px]" data-testid="select-payroll-year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filterYears.map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="h-6 w-px bg-border max-sm:hidden mx-1"></div>

            <Select value={filterOffice} onValueChange={v => { setFilterOffice(v); setFilterBranch("all"); }}>
              <SelectTrigger className="w-[140px]" data-testid="select-filter-office">
                <SelectValue placeholder="Lokasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Lokasi</SelectItem>
                <SelectItem value="pusat">Kantor Pusat</SelectItem>
                <SelectItem value="cabang">Kantor Cabang</SelectItem>
              </SelectContent>
            </Select>

            {filterOffice === "cabang" && (
              <Select value={filterBranch} onValueChange={setFilterBranch}>
                <SelectTrigger className="w-[160px]" data-testid="select-filter-branch">
                  <SelectValue placeholder="Semua Cabang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Cabang</SelectItem>
                  {branches.map(b => (
                    <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Badge className="bg-primary/10 text-primary border-primary/20 text-sm px-3 py-1.5" data-testid="badge-active-period">
              📅 Periode Aktif: {BULAN_LABELS[parseInt(filterMonth) - 1]} {filterYear}
            </Badge>
            <div className="ml-auto flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {paidCount} pegawai digaji</span>
              <span>·</span>
              <span>Rata-rata: {formatRp(String(Math.round(avgNet)))}</span>
            </div>
          </div>
        </CardContent>
      </Card>

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
          branches={branches}
        />
      )}

      {isAdmin && (
        <AddPayrollDialog
          open={showAddPayroll}
          onClose={() => setShowAddPayroll(false)}
          employees={employees}
        />
      )}
    </div>
  );
}
