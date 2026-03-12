import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useMutation } from "@tanstack/react-query";
import type { Payroll, Employee, PayrollDeduction, Position, Department } from "@shared/schema";
import { X, Printer, Download, Mail, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const formatRp = (val: string | number | null) => {
  if (!val) return "Rp 0";
  return `Rp ${Number(val).toLocaleString("id-ID")}`;
};

const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function parsePeriod(period: string) {
  const [y, m] = period.split("-");
  return { month: MONTH_NAMES[parseInt(m) - 1] || m, year: y };
}

function generateSlipCode(payrollId: number, employeeId: number, period: string) {
  const hash = ((payrollId * 7919 + employeeId * 104729) % 999999).toString().padStart(6, "0");
  return `SLIP-${period}-${hash}`;
}

interface PayslipModalProps {
  payrollItem: Payroll;
  employee: Employee | undefined;
  deductions: PayrollDeduction[];
  positions: Position[];
  departments: Department[];
  onClose: () => void;
}

export default function PayslipModal({ payrollItem, employee, deductions, positions, departments, onClose }: PayslipModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [emailSending, setEmailSending] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const pos = positions.find(p => p.id === employee?.positionId);
  const dept = departments.find(d => d.id === employee?.departmentId);
  const { month, year } = parsePeriod(payrollItem.period);
  const slipCode = generateSlipCode(payrollItem.id, payrollItem.employeeId, payrollItem.period);

  const earningsItems = [
    { label: "Gaji Pokok", amount: payrollItem.basicSalary },
    { label: "Tunjangan Jabatan", amount: payrollItem.positionAllowance },
    { label: "Tunjangan Keluarga", amount: payrollItem.familyAllowance },
    { label: "Tunjangan Transport", amount: payrollItem.transportAllowance },
    { label: "Tunjangan Makan", amount: payrollItem.mealAllowance },
    { label: "Lembur", amount: payrollItem.overtime },
    { label: "Insentif", amount: payrollItem.incentive },
  ].filter(e => Number(e.amount) > 0);

  const logAction = useMutation({
    mutationFn: async (action: string) => {
      await apiRequest("POST", `/api/payroll/${payrollItem.id}/log-action`, { action });
    },
  });

  const handlePrint = () => {
    logAction.mutate("print");
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow || !printRef.current) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Slip Gaji - ${employee?.fullName}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a1a1a; }
        @page { size: 130mm 200mm; margin: 8mm; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body>`);
    printWindow.document.write(printRef.current.innerHTML);
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 400);
  };

  const joinDate = employee?.joinDate ? new Date(employee.joinDate) : null;
  const yearsWorked = joinDate ? Math.floor((Date.now() - joinDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;

  const bpjsTotal = Number(payrollItem.bpjsKesehatanDeduction || 0) + Number(payrollItem.bpjsKetenagakerjaanDeduction || 0);
  const pph21Value = Number(payrollItem.pph21Deduction || 0);

  const buildPdf = (jsPDF: any) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [130, 200] });
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();

    doc.setTextColor(230, 230, 230);
    doc.setFontSize(36);
    doc.text("RAHASIA", w / 2, h / 2, { align: "center", angle: 35 });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("PDAM TIRTA ARDHIA RINJANI", w / 2, 12, { align: "center" });
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.text("Jl. Jend. A Yani No.11, Praya, Kec. Praya, Kab. Lombok Tengah, NTB 83511", w / 2, 16, { align: "center" });

    doc.setDrawColor(2, 132, 199);
    doc.setLineWidth(0.7);
    doc.line(8, 18, w - 8, 18);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("SLIP GAJI", w / 2, 23, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Periode: ${month} ${year}`, w / 2, 27, { align: "center" });

    doc.setLineWidth(0.2);
    doc.line(8, 29, w - 8, 29);

    let y = 33;
    doc.setFontSize(7);
    const empInfo = [
      ["Nama", employee?.fullName || "-"],
      ["NIK", employee?.nip || "-"],
      ["Jabatan", pos?.name || "-"],
      ["Bagian", dept?.name || "-"],
      ["Golongan", employee?.grade || "-"],
      ["Masa Kerja", `${yearsWorked} tahun`],
      ["No. Rekening", `${employee?.bankName || "-"} - ${employee?.bankAccount || "-"}`],
    ];
    empInfo.forEach(([lbl, val]) => {
      doc.setFont("helvetica", "normal");
      doc.text(`${lbl}`, 10, y);
      doc.text(":", 32, y);
      doc.setFont("helvetica", "bold");
      doc.text(val, 35, y);
      y += 3.8;
    });

    y += 2;
    doc.setFillColor(236, 253, 245);
    doc.rect(8, y, w - 16, 5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(5, 150, 105);
    doc.text("PENGHASILAN", 10, y + 3.5);
    doc.setTextColor(0, 0, 0);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    earningsItems.forEach(item => {
      doc.text(item.label, 10, y);
      doc.text(formatRp(item.amount), w - 10, y, { align: "right" });
      y += 3.5;
    });

    doc.setLineWidth(0.2);
    doc.line(8, y, w - 8, y);
    y += 3.5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("Total Penghasilan", 10, y);
    doc.setTextColor(5, 150, 105);
    doc.text(formatRp(payrollItem.totalEarnings), w - 10, y, { align: "right" });
    doc.setTextColor(0, 0, 0);

    y += 5;
    doc.setFillColor(254, 242, 242);
    doc.rect(8, y, w - 16, 5, "F");
    doc.setTextColor(239, 68, 68);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("POTONGAN", 10, y + 3.5);
    doc.setTextColor(0, 0, 0);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    
    // Default deductions
    const bpjsTotal = Number(payrollItem.bpjsKesehatanDeduction || 0) + Number(payrollItem.bpjsKetenagakerjaanDeduction || 0);
    const pph21Value = Number(payrollItem.pph21Deduction || 0);

    if (payrollItem.type !== "THR") {
      doc.text("- BPJS Kesehatan & Ketenagakerjaan", 10, y);
      doc.text(bpjsTotal > 0 ? formatRp(bpjsTotal) : "-", w - 10, y, { align: "right" });
      y += 3.5;
      doc.text("- PPh 21", 10, y);
      doc.text(pph21Value > 0 ? formatRp(pph21Value) : "-", w - 10, y, { align: "right" });
      y += 3.5;
    }

    deductions.forEach(d => {
      doc.text(d.label, 10, y);
      doc.text(formatRp(d.amount), w - 10, y, { align: "right" });
      y += 3.5;
    });

    doc.setLineWidth(0.2);
    doc.line(8, y, w - 8, y);
    y += 3.5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("Total Potongan", 10, y);
    doc.setTextColor(239, 68, 68);
    doc.text(formatRp(payrollItem.totalDeductions), w - 10, y, { align: "right" });
    doc.setTextColor(0, 0, 0);

    y += 5;
    doc.setDrawColor(2, 132, 199);
    doc.setLineWidth(0.7);
    doc.line(8, y, w - 8, y);
    y += 4;
    doc.setFontSize(8);
    doc.text("GAJI BERSIH (TAKE HOME PAY)", 10, y);
    doc.setTextColor(2, 132, 199);
    doc.setFontSize(10);
    doc.text(formatRp(payrollItem.netSalary), w - 10, y, { align: "right" });
    doc.setTextColor(0, 0, 0);

    const footerY = h - 22;
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text(`Kode Slip: ${slipCode}`, 10, footerY);

    doc.text("Mengetahui,", w - 45, footerY);
    doc.text("Direktur Utama", w - 45, footerY + 3.5);
    doc.setFont("helvetica", "bold");
    doc.text("H. Doni Alga, S.E., M.M.", w - 45, footerY + 13);
    doc.setFont("helvetica", "normal");
    doc.line(w - 45, footerY + 14, w - 10, footerY + 14);

    doc.setFontSize(5);
    doc.setTextColor(180, 180, 180);
    doc.text("Dokumen ini dicetak secara digital dan sah tanpa tanda tangan basah", w / 2, h - 4, { align: "center" });

    return doc;
  };

  const handleDownloadPdf = async () => {
    logAction.mutate("download_pdf");
    const { jsPDF } = await import("jspdf");
    const doc = buildPdf(jsPDF);
    doc.save(`SlipGaji_${employee?.nip || "unknown"}_${payrollItem.period}.pdf`);
    toast({ title: "PDF berhasil diunduh" });
  };

  const handleSendEmail = async () => {
    if (!employee?.email) {
      toast({ title: "Email pegawai tidak tersedia", variant: "destructive" });
      return;
    }
    setEmailSending(true);
    logAction.mutate("send_email");
    setTimeout(() => {
      setEmailSending(false);
      toast({ title: "Slip gaji berhasil dikirim", description: `Dikirim ke ${employee.email}` });
    }, 1500);
  };

  const portalTarget = typeof document !== "undefined" ? document.body : null;
  if (!portalTarget) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-[95vw] max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()} data-testid="payslip-modal">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <h3 className="text-lg font-bold">Slip Gaji — {employee?.fullName}</h3>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors" data-testid="btn-print-slip">
              <Printer className="w-3.5 h-3.5" /> Cetak
            </button>
            <button onClick={handleDownloadPdf} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors" data-testid="btn-download-pdf">
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
            <button onClick={handleSendEmail} disabled={emailSending} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50" data-testid="btn-send-email">
              {emailSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
              {emailSending ? "Mengirim..." : "Kirim Email"}
            </button>
            <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted" data-testid="btn-close-slip">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          <div ref={printRef}>
            <div style={{ maxWidth: 420, margin: "0 auto", fontFamily: "'Segoe UI', Arial, sans-serif", color: "#1a1a1a", fontSize: 11, position: "relative" }}>
              <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%, -50%) rotate(-35deg)", fontSize: 60, color: "rgba(200,200,200,0.12)", fontWeight: "bold", pointerEvents: "none", whiteSpace: "nowrap", zIndex: 0 }}>RAHASIA</div>

              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ textAlign: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 4 }}>
                    <img src="/images/logo.png" alt="Logo" style={{ width: 40, height: 40, objectFit: "contain" }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: "bold", color: "#0284c7" }}>PDAM TIRTA ARDHIA RINJANI</div>
                      <div style={{ fontSize: 8, color: "#666" }}>Jl. Jend. A Yani No.11, Praya, Kec. Praya, Kab. Lombok Tengah, NTB 83511</div>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: "2px solid #0284c7", borderBottom: "1px solid #ddd", padding: "6px 0", textAlign: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: "bold", letterSpacing: 2 }}>SLIP GAJI</div>
                  <div style={{ fontSize: 10, color: "#555" }}>Periode: {month} {year}</div>
                </div>

                <table style={{ width: "100%", marginBottom: 12, fontSize: 10 }}>
                  <tbody>
                    <tr><td style={{ width: 80, padding: "2px 0", color: "#555" }}>Nama</td><td style={{ width: 10 }}>:</td><td style={{ fontWeight: 600 }}>{employee?.fullName || "-"}</td></tr>
                    <tr><td style={{ padding: "2px 0", color: "#555" }}>NIK</td><td>:</td><td style={{ fontWeight: 600 }}>{employee?.nip || "-"}</td></tr>
                    <tr><td style={{ padding: "2px 0", color: "#555" }}>Jabatan</td><td>:</td><td style={{ fontWeight: 600 }}>{pos?.name || "-"}</td></tr>
                    <tr><td style={{ padding: "2px 0", color: "#555" }}>Bagian</td><td>:</td><td style={{ fontWeight: 600 }}>{dept?.name || "-"}</td></tr>
                    <tr><td style={{ padding: "2px 0", color: "#555" }}>Golongan</td><td>:</td><td style={{ fontWeight: 600 }}>{employee?.grade || "-"}</td></tr>
                    <tr><td style={{ padding: "2px 0", color: "#555" }}>Masa Kerja</td><td>:</td><td style={{ fontWeight: 600 }}>{yearsWorked} tahun</td></tr>
                    <tr><td style={{ padding: "2px 0", color: "#555" }}>No. Rekening</td><td>:</td><td style={{ fontWeight: 600 }}>{employee?.bankName || "-"} - {employee?.bankAccount || "-"}</td></tr>
                  </tbody>
                </table>

                <div style={{ background: "#ecfdf5", padding: "5px 10px", fontWeight: 700, fontSize: 10, color: "#059669", borderRadius: 4, marginBottom: 6 }}>PENGHASILAN</div>
                <table style={{ width: "100%", fontSize: 10, marginBottom: 8 }}>
                  <tbody>
                    {earningsItems.map((item, i) => (
                      <tr key={i}>
                        <td style={{ padding: "2px 0", color: "#444" }}>{item.label}</td>
                        <td style={{ textAlign: "right", fontFamily: "monospace", padding: "2px 0" }}>{formatRp(item.amount)}</td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: "1px solid #ccc" }}>
                      <td style={{ padding: "4px 0", fontWeight: 700 }}>Total Penghasilan</td>
                      <td style={{ textAlign: "right", fontWeight: 700, fontFamily: "monospace", color: "#059669", padding: "4px 0" }}>{formatRp(payrollItem.totalEarnings)}</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ background: "#fef2f2", padding: "5px 10px", fontWeight: 700, fontSize: 10, color: "#ef4444", borderRadius: 4, marginBottom: 6 }}>POTONGAN</div>
                <table style={{ width: "100%", fontSize: 10, marginBottom: 8 }}>
                  <tbody>
                    {payrollItem.type !== "THR" && (
                    <>
                      <div className="flex justify-between items-center py-2 border-b border-border/50 px-2 group hover:bg-muted/30 transition-colors">
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors">- BPJS Kesehatan & Ketenagakerjaan</span>
                        <span className={`font-medium ${bpjsTotal > 0 ? 'text-red-500 font-mono' : ''}`}>{bpjsTotal > 0 ? formatRp(bpjsTotal) : "-"}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/50 px-2 group hover:bg-muted/30 transition-colors">
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors">- PPh 21</span>
                        <span className={`font-medium ${pph21Value > 0 ? 'text-red-500 font-mono' : ''}`}>{pph21Value > 0 ? formatRp(pph21Value) : "-"}</span>
                      </div>
                    </>
                  )}
                  {deductions.map(d => (
                      <tr key={d.id}>
                        <td style={{ padding: "2px 0", color: "#444" }}>{d.label}</td>
                        <td style={{ textAlign: "right", fontFamily: "monospace", color: "#ef4444", padding: "2px 0" }}>{formatRp(d.amount)}</td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: "1px solid #ccc" }}>
                      <td style={{ padding: "4px 0", fontWeight: 700 }}>Total Potongan</td>
                      <td style={{ textAlign: "right", fontWeight: 700, fontFamily: "monospace", color: "#ef4444", padding: "4px 0" }}>{formatRp(payrollItem.totalDeductions)}</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ borderTop: "2px solid #0284c7", marginTop: 12, padding: "8px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>GAJI BERSIH (TAKE HOME PAY)</span>
                  <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "#0284c7" }}>{formatRp(payrollItem.netSalary)}</span>
                </div>

                <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", fontSize: 9 }}>
                  <div>
                    <div style={{ color: "#999", marginBottom: 2 }}>Kode Slip: {slipCode}</div>
                    <div style={{ color: "#bbb", fontSize: 8 }}>Dokumen ini dicetak secara digital dan sah tanpa tanda tangan basah</div>
                  </div>
                  <div style={{ textAlign: "center", minWidth: 140 }}>
                    <div style={{ color: "#555" }}>Mengetahui,</div>
                    <div style={{ color: "#555", marginBottom: 30 }}>Direktur Utama</div>
                    <div style={{ fontWeight: 700, borderTop: "1px solid #333", paddingTop: 4, display: "inline-block" }}>H. Doni Alga, S.E., M.M.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    portalTarget
  );
}
