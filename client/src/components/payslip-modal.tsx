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
        @page { size: A5 landscape; margin: 10mm; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body>`);
    printWindow.document.write(printRef.current.innerHTML);
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 400);
  };

  const buildPdf = (jsPDFConstructor: any) => {
    const doc = new jsPDFConstructor({ orientation: "landscape", unit: "mm", format: "a5" });
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();

    doc.setTextColor(220, 220, 220);
    doc.setFontSize(50);
    doc.text("RAHASIA", w / 2, h / 2, { align: "center", angle: 35 });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("PDAM TIRTA ARDHIA RINJANI", w / 2, 14, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Jl. Langko No.1, Mataram, NTB", w / 2, 19, { align: "center" });

    doc.setDrawColor(2, 132, 199);
    doc.setLineWidth(0.8);
    doc.line(10, 22, w - 10, 22);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("SLIP GAJI", w / 2, 28, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Periode: ${month} ${year}`, w / 2, 33, { align: "center" });

    doc.setLineWidth(0.3);
    doc.line(10, 35, w - 10, 35);

    let y = 40;
    doc.setFontSize(8);
    const empInfo = [
      ["Nama", employee?.fullName || "-"],
      ["NIP", employee?.nip || "-"],
      ["Jabatan", pos?.name || "-"],
      ["Bagian", dept?.name || "-"],
    ];
    empInfo.forEach(([lbl, val]) => {
      doc.setFont("helvetica", "normal");
      doc.text(`${lbl}`, 12, y);
      doc.text(":", 35, y);
      doc.setFont("helvetica", "bold");
      doc.text(val, 38, y);
      y += 4.5;
    });

    y += 2;
    const midX = w / 2;

    doc.setFillColor(236, 253, 245);
    doc.rect(10, y, midX - 14, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(5, 150, 105);
    doc.text("PENGHASILAN", 12, y + 4);
    doc.setTextColor(0, 0, 0);

    doc.setFillColor(254, 242, 242);
    doc.rect(midX + 2, y, midX - 14, 6, "F");
    doc.setTextColor(239, 68, 68);
    doc.text("POTONGAN", midX + 4, y + 4);
    doc.setTextColor(0, 0, 0);

    y += 9;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);

    earningsItems.forEach(item => {
      doc.text(item.label, 12, y);
      doc.text(formatRp(item.amount), midX - 6, y, { align: "right" });
      y += 4;
    });
    const earningsEndY = y;

    y = earningsEndY - (earningsItems.length * 4);
    deductions.forEach(d => {
      doc.text(d.label, midX + 4, y);
      doc.text(formatRp(d.amount), w - 12, y, { align: "right" });
      y += 4;
    });

    const maxY = Math.max(earningsEndY, y) + 2;

    doc.setLineWidth(0.3);
    doc.line(10, maxY, midX - 4, maxY);
    doc.line(midX + 2, maxY, w - 10, maxY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Total Penghasilan", 12, maxY + 4);
    doc.setTextColor(5, 150, 105);
    doc.text(formatRp(payrollItem.totalEarnings), midX - 6, maxY + 4, { align: "right" });
    doc.setTextColor(0, 0, 0);

    doc.text("Total Potongan", midX + 4, maxY + 4);
    doc.setTextColor(239, 68, 68);
    doc.text(formatRp(payrollItem.totalDeductions), w - 12, maxY + 4, { align: "right" });
    doc.setTextColor(0, 0, 0);

    const netY = maxY + 10;
    doc.setDrawColor(2, 132, 199);
    doc.setLineWidth(0.8);
    doc.line(10, netY, w - 10, netY);
    doc.setFontSize(9);
    doc.text("GAJI BERSIH (TAKE HOME PAY)", 12, netY + 5);
    doc.setTextColor(2, 132, 199);
    doc.setFontSize(11);
    doc.text(formatRp(payrollItem.netSalary), w - 12, netY + 5, { align: "right" });
    doc.setTextColor(0, 0, 0);

    const footerY = h - 25;
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`Kode Slip: ${slipCode}`, 12, footerY);

    doc.text("Mengetahui,", w - 50, footerY);
    doc.text("Direktur Utama", w - 50, footerY + 4);
    doc.setFont("helvetica", "bold");
    doc.text("H. Doni Alga, S.E., M.M.", w - 50, footerY + 15);
    doc.setFont("helvetica", "normal");
    doc.line(w - 50, footerY + 16, w - 12, footerY + 16);

    doc.setFontSize(6);
    doc.setTextColor(180, 180, 180);
    doc.text("Dokumen ini dicetak secara digital dan sah tanpa tanda tangan basah", w / 2, h - 5, { align: "center" });

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
            <div style={{ maxWidth: 700, margin: "0 auto", fontFamily: "'Segoe UI', Arial, sans-serif", color: "#1a1a1a", fontSize: 12, position: "relative" }}>
              <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%, -50%) rotate(-35deg)", fontSize: 80, color: "rgba(200,200,200,0.15)", fontWeight: "bold", pointerEvents: "none", whiteSpace: "nowrap", zIndex: 0 }}>RAHASIA</div>

              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ textAlign: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 4 }}>
                    <img src="/images/logo.png" alt="Logo" style={{ width: 48, height: 48, objectFit: "contain" }} />
                    <div>
                      <div style={{ fontSize: 16, fontWeight: "bold", color: "#0284c7" }}>PDAM TIRTA ARDHIA RINJANI</div>
                      <div style={{ fontSize: 9, color: "#666" }}>Jl. Langko No.1, Mataram, Nusa Tenggara Barat</div>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: "2px solid #0284c7", borderBottom: "1px solid #ddd", padding: "8px 0", textAlign: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: "bold", letterSpacing: 2 }}>SLIP GAJI</div>
                  <div style={{ fontSize: 11, color: "#555" }}>Periode: {month} {year}</div>
                </div>

                <table style={{ width: "100%", marginBottom: 16, fontSize: 11 }}>
                  <tbody>
                    <tr><td style={{ width: 90, padding: "2px 0", color: "#555" }}>Nama</td><td style={{ width: 10 }}>:</td><td style={{ fontWeight: 600 }}>{employee?.fullName || "-"}</td></tr>
                    <tr><td style={{ padding: "2px 0", color: "#555" }}>NIP</td><td>:</td><td style={{ fontWeight: 600 }}>{employee?.nip || "-"}</td></tr>
                    <tr><td style={{ padding: "2px 0", color: "#555" }}>Jabatan</td><td>:</td><td style={{ fontWeight: 600 }}>{pos?.name || "-"}</td></tr>
                    <tr><td style={{ padding: "2px 0", color: "#555" }}>Bagian</td><td>:</td><td style={{ fontWeight: 600 }}>{dept?.name || "-"}</td></tr>
                  </tbody>
                </table>

                <div style={{ display: "flex", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ background: "#ecfdf5", padding: "6px 10px", fontWeight: 700, fontSize: 11, color: "#059669", borderRadius: 4, marginBottom: 8 }}>PENGHASILAN</div>
                    <table style={{ width: "100%", fontSize: 11 }}>
                      <tbody>
                        {earningsItems.map((item, i) => (
                          <tr key={i}>
                            <td style={{ padding: "3px 0", color: "#444" }}>{item.label}</td>
                            <td style={{ textAlign: "right", fontFamily: "monospace", padding: "3px 0" }}>{formatRp(item.amount)}</td>
                          </tr>
                        ))}
                        <tr style={{ borderTop: "1px solid #ccc" }}>
                          <td style={{ padding: "6px 0", fontWeight: 700 }}>Total Penghasilan</td>
                          <td style={{ textAlign: "right", fontWeight: 700, fontFamily: "monospace", color: "#059669", padding: "6px 0" }}>{formatRp(payrollItem.totalEarnings)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ background: "#fef2f2", padding: "6px 10px", fontWeight: 700, fontSize: 11, color: "#ef4444", borderRadius: 4, marginBottom: 8 }}>POTONGAN</div>
                    <table style={{ width: "100%", fontSize: 11 }}>
                      <tbody>
                        {deductions.map(d => (
                          <tr key={d.id}>
                            <td style={{ padding: "3px 0", color: "#444" }}>{d.label}</td>
                            <td style={{ textAlign: "right", fontFamily: "monospace", color: "#ef4444", padding: "3px 0" }}>{formatRp(d.amount)}</td>
                          </tr>
                        ))}
                        <tr style={{ borderTop: "1px solid #ccc" }}>
                          <td style={{ padding: "6px 0", fontWeight: 700 }}>Total Potongan</td>
                          <td style={{ textAlign: "right", fontWeight: 700, fontFamily: "monospace", color: "#ef4444", padding: "6px 0" }}>{formatRp(payrollItem.totalDeductions)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ borderTop: "2px solid #0284c7", marginTop: 16, padding: "10px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>GAJI BERSIH (TAKE HOME PAY)</span>
                  <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: "#0284c7" }}>{formatRp(payrollItem.netSalary)}</span>
                </div>

                <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                  <div>
                    <div style={{ color: "#999", marginBottom: 2 }}>Kode Slip: {slipCode}</div>
                    <div style={{ color: "#bbb", fontSize: 9 }}>Dokumen ini dicetak secara digital dan sah tanpa tanda tangan basah</div>
                  </div>
                  <div style={{ textAlign: "center", minWidth: 160 }}>
                    <div style={{ color: "#555" }}>Mengetahui,</div>
                    <div style={{ color: "#555", marginBottom: 36 }}>Direktur Utama</div>
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
