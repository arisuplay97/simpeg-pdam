import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, comparePassword, requireAuth, requireAdmin, requireDirektur, requireSuperAdmin } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const photoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(uploadsDir, "photos");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `photo_${Date.now()}${ext}`);
  },
});

const docStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(uploadsDir, "documents");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `doc_${Date.now()}${ext}`);
  },
});

const attendanceStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(uploadsDir, "attendance");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `att_${Date.now()}${ext}`);
  },
});

const uploadPhoto = multer({ storage: photoStorage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Hanya file gambar yang diizinkan"));
}});

const uploadDoc = multer({ storage: docStorage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
  if (file.mimetype === "application/pdf" || file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Hanya file PDF atau gambar yang diizinkan"));
}});

const uploadAttendance = multer({ storage: attendanceStorage, limits: { fileSize: 5 * 1024 * 1024 } });
export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username dan password harus diisi" });
      }
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Username atau password salah" });
      }
      const valid = await comparePassword(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Username atau password salah" });
      }
      req.session.userId = user.id;
      req.session.role = user.role;
      req.session.employeeId = user.employeeId;

      let employee = null;
      if (user.employeeId) {
        employee = await storage.getEmployee(user.employeeId);
      }

      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        employeeId: user.employeeId,
        employee,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ message: "Gagal logout" });
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    let employee = null;
    if (user.employeeId) {
      employee = await storage.getEmployee(user.employeeId);
    }
    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      employeeId: user.employeeId,
      employee,
    });
  });

  app.use("/api/dashboard", requireAuth);
  app.use("/api/branches", requireAuth);
  app.use("/api/departments", requireAuth);
  app.use("/api/sub-departments", requireAuth);
  app.use("/api/positions", requireAuth);
  app.use("/api/employees", requireAuth);
  app.use("/api/attendance", requireAuth);
  app.use("/api/leave-requests", requireAuth);
  app.use("/api/payroll", requireAuth);

  app.use("/api/performance", requireAuth);
  app.use("/api/mutations", requireAuth);
  app.use("/api/trainings", requireAuth);
  app.use("/api/documents", requireAuth);
  app.use("/api/notifications", requireAuth);
  app.use("/api/rank-promotions", requireAuth);
  app.use("/api/salary-increases", requireAuth);
  app.use("/api/retirement", requireAuth);
  app.use("/api/approval-logs", requireAuth);
  app.use("/api/eligible-promotions", requireAuth);
  app.use("/api/eligible-salary-increases", requireAuth);

  app.use("/api/users", requireAuth);
  app.get("/api/users/employee/:id", async (req, res) => {
    const user = await storage.getUserByEmployeeId(parseInt(req.params.id));
    if (user) {
      res.json({ exists: true, username: user.username, role: user.role, id: user.id });
    } else {
      res.json({ exists: false });
    }
  });
  app.post("/api/users", requireSuperAdmin, async (req, res) => {
    try {
      const { username, password, role, employeeId } = req.body;
      if (!username || !password || !role) {
        return res.status(400).json({ message: "Username, password, dan role wajib diisi" });
      }
      if (!["admin", "pegawai"].includes(role)) {
        return res.status(400).json({ message: "Role harus admin atau pegawai" });
      }
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ message: "Username sudah digunakan" });
      }
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        role,
        employeeId: employeeId || null,
      });
      res.json({ success: true, username: user.username, role: user.role });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  app.delete("/api/users/:id", requireSuperAdmin, async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/dashboard/stats", async (_req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  app.get("/api/departments", async (_req, res) => {
    const data = await storage.getDepartments();
    res.json(data);
  });
  app.post("/api/departments", async (req, res) => {
    const data = await storage.createDepartment(req.body);
    res.json(data);
  });
  app.put("/api/departments/:id", async (req, res) => {
    const data = await storage.updateDepartment(parseInt(req.params.id), req.body);
    res.json(data);
  });
  app.delete("/api/departments/:id", requireSuperAdmin, async (req, res) => {
    await storage.deleteDepartment(parseInt(req.params.id));
    res.json({ success: true });
  });

  app.get("/api/branches", async (_req, res) => {
    const data = await storage.getBranches();
    res.json(data);
  });
  app.post("/api/branches", async (req, res) => {
    const data = await storage.createBranch(req.body);
    res.json(data);
  });
  app.put("/api/branches/:id", async (req, res) => {
    const data = await storage.updateBranch(parseInt(req.params.id), req.body);
    res.json(data);
  });
  app.delete("/api/branches/:id", requireSuperAdmin, async (req, res) => {
    await storage.deleteBranch(parseInt(req.params.id));
    res.json({ success: true });
  });

  app.get("/api/sub-departments", async (_req, res) => {
    const data = await storage.getSubDepartments();
    res.json(data);
  });
  app.post("/api/sub-departments", async (req, res) => {
    const data = await storage.createSubDepartment(req.body);
    res.json(data);
  });
  app.put("/api/sub-departments/:id", async (req, res) => {
    const data = await storage.updateSubDepartment(parseInt(req.params.id), req.body);
    res.json(data);
  });
  app.delete("/api/sub-departments/:id", requireSuperAdmin, async (req, res) => {
    await storage.deleteSubDepartment(parseInt(req.params.id));
    res.json({ success: true });
  });

  app.get("/api/positions", async (_req, res) => {
    const data = await storage.getPositions();
    res.json(data);
  });
  app.post("/api/positions", async (req, res) => {
    const data = await storage.createPosition(req.body);
    res.json(data);
  });

  app.get("/api/employees", async (_req, res) => {
    const data = await storage.getEmployees();
    res.json(data);
  });
  app.get("/api/employees/:id", async (req, res) => {
    const data = await storage.getEmployee(parseInt(req.params.id));
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  });
  app.post("/api/employees", async (req, res) => {
    const data = await storage.createEmployee(req.body);
    res.json(data);
  });
  app.put("/api/employees/:id", async (req, res) => {
    const data = await storage.updateEmployee(parseInt(req.params.id), req.body);
    res.json(data);
  });
  app.delete("/api/employees/:id", requireSuperAdmin, async (req, res) => {
    try {
      const empId = parseInt(req.params.id);
      await storage.deleteEmployee(empId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/attendance", async (req, res) => {
    const data = await storage.getAttendance(req.query.date as string | undefined);
    res.json(data);
  });
  app.get("/api/attendance/employee/:id", async (req, res) => {
    const data = await storage.getAttendanceByEmployee(parseInt(req.params.id));
    res.json(data);
  });
  app.post("/api/attendance", async (req, res) => {
    const data = await storage.createAttendance(req.body);
    res.json(data);
  });
  app.put("/api/attendance/:id", async (req, res) => {
    const data = await storage.updateAttendance(parseInt(req.params.id), req.body);
    res.json(data);
  });

  app.get("/api/leave-requests", async (_req, res) => {
    const data = await storage.getLeaveRequests();
    res.json(data);
  });
  app.get("/api/leave-requests/employee/:id", async (req, res) => {
    const data = await storage.getLeaveRequestsByEmployee(parseInt(req.params.id));
    res.json(data);
  });
  app.post("/api/leave-requests", async (req, res) => {
    const data = await storage.createLeaveRequest(req.body);
    res.json(data);
  });
  app.put("/api/leave-requests/:id", async (req, res) => {
    const data = await storage.updateLeaveRequest(parseInt(req.params.id), req.body);
    res.json(data);
  });

  app.get("/api/payroll", async (req, res) => {
    const data = await storage.getPayroll(req.query.period as string | undefined);
    res.json(data);
  });
  app.get("/api/payroll/employee/:id", async (req, res) => {
    const data = await storage.getPayrollByEmployee(parseInt(req.params.id));
    res.json(data);
  });
  app.post("/api/payroll", async (req, res) => {
    const data = await storage.createPayroll(req.body);
    res.json(data);
  });
  app.put("/api/payroll/:id", async (req, res) => {
    const data = await storage.updatePayroll(parseInt(req.params.id), req.body);
    res.json(data);
  });
  app.delete("/api/payroll/:id", requireDirektur, async (req, res) => {
    try {
      await storage.deletePayroll(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/payroll/:id/deductions", async (req, res) => {
    const data = await storage.getPayrollDeductions(parseInt(req.params.id));
    res.json(data);
  });
  app.post("/api/payroll/:id/deductions", requireDirektur, async (req, res) => {
    try {
      const { label, amount, description, type } = req.body;
      if (!label || typeof label !== "string" || label.trim().length === 0) {
        return res.status(400).json({ message: "Nama potongan harus diisi" });
      }
      const amountNum = Number(amount);
      if (!amount || isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({ message: "Jumlah harus angka positif" });
      }

      const payrollId = parseInt(req.params.id);
      const pr = await storage.getPayrollById(payrollId);
      if (!pr) return res.status(404).json({ message: "Payroll not found" });

      const deduction = await storage.createPayrollDeduction({
        payrollId,
        employeeId: pr.employeeId,
        period: pr.period,
        type: type || "custom",
        label: label.trim(),
        amount: String(amountNum),
        description: description || null,
      });

      const newTotal = Number(pr.totalDeductions) + amountNum;
      await storage.updatePayroll(payrollId, {
        totalDeductions: String(newTotal),
        netSalary: String(Number(pr.totalEarnings) - newTotal),
      } as any);

      res.json(deduction);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/payroll/:id/log-action", async (req, res) => {
    try {
      const payrollId = parseInt(req.params.id);
      const pr = await storage.getPayrollById(payrollId);
      if (!pr) return res.status(404).json({ message: "Payroll not found" });

      const role = req.session.role;
      const empId = req.session.employeeId;
      const isAdmin = role === "admin" || role === "direktur";
      const isOwner = empId === pr.employeeId;
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: "Tidak memiliki akses untuk slip gaji ini" });
      }

      const { action } = req.body;
      if (!action || !["print", "download_pdf", "send_email"].includes(action)) {
        return res.status(400).json({ message: "Aksi tidak valid" });
      }

      await storage.createPayslipLog({
        payrollId,
        employeeId: pr.employeeId,
        action,
        performedBy: String(req.session.userId || "unknown"),
        ipAddress: req.ip || null,
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.use("/api/payroll-deductions", requireAuth);
  app.delete("/api/payroll-deductions/:id", requireDirektur, async (req, res) => {
    try {
      const deductionId = parseInt(req.params.id);
      const foundDeduction = await storage.getPayrollDeductionById(deductionId);
      if (!foundDeduction) {
        return res.status(404).json({ message: "Deduction not found" });
      }
      if (foundDeduction.type !== "custom") {
        return res.status(400).json({ message: "Hanya potongan custom yang bisa dihapus" });
      }

      const foundPayroll = await storage.getPayrollById(foundDeduction.payrollId);
      if (!foundPayroll) {
        return res.status(404).json({ message: "Payroll not found" });
      }

      await storage.deletePayrollDeduction(deductionId);

      const newTotal = Number(foundPayroll.totalDeductions) - Number(foundDeduction.amount);
      await storage.updatePayroll(foundPayroll.id, {
        totalDeductions: String(newTotal),
        netSalary: String(Number(foundPayroll.totalEarnings) - newTotal),
      } as any);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/export-logs", requireDirektur, async (req, res) => {
    try {
      const userId = req.session.userId;
      const sessionUser = userId ? await storage.getUserById(userId) : null;
      const log = await storage.createExportLog({
        exportType: req.body.exportType || "payroll_excel",
        period: req.body.period || null,
        filters: req.body.filters || null,
        performedBy: sessionUser?.username || "unknown",
        performedByName: sessionUser?.role || "unknown",
        ipAddress: req.ip || null,
      });
      res.json(log);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/performance", async (_req, res) => {
    const data = await storage.getPerformanceReviews();
    res.json(data);
  });
  app.get("/api/performance/employee/:id", async (req, res) => {
    const data = await storage.getPerformanceByEmployee(parseInt(req.params.id));
    res.json(data);
  });
  app.post("/api/performance", async (req, res) => {
    const data = await storage.createPerformanceReview(req.body);
    res.json(data);
  });

  app.get("/api/mutations", async (_req, res) => {
    const data = await storage.getMutations();
    res.json(data);
  });
  app.get("/api/mutations/employee/:id", async (req, res) => {
    const data = await storage.getMutationsByEmployee(parseInt(req.params.id));
    res.json(data);
  });
  app.post("/api/mutations", async (req, res) => {
    const data = await storage.createMutation(req.body);
    res.json(data);
  });
  app.put("/api/mutations/:id", async (req, res) => {
    const data = await storage.updateMutation(parseInt(req.params.id), req.body);
    res.json(data);
  });

  app.get("/api/trainings", async (_req, res) => {
    const data = await storage.getTrainings();
    res.json(data);
  });
  app.post("/api/trainings", async (req, res) => {
    const data = await storage.createTraining(req.body);
    res.json(data);
  });

  app.get("/api/documents", async (_req, res) => {
    const data = await storage.getDocuments();
    res.json(data);
  });
  app.get("/api/documents/employee/:id", async (req, res) => {
    const data = await storage.getDocumentsByEmployee(parseInt(req.params.id));
    res.json(data);
  });
  app.post("/api/documents", async (req, res) => {
    const data = await storage.createDocument(req.body);
    res.json(data);
  });

  app.get("/api/notifications", async (_req, res) => {
    const data = await storage.getNotifications();
    res.json(data);
  });
  app.post("/api/notifications", async (req, res) => {
    const data = await storage.createNotification(req.body);
    res.json(data);
  });
  app.put("/api/notifications/:id/read", async (req, res) => {
    await storage.markNotificationRead(parseInt(req.params.id));
    res.json({ success: true });
  });

  app.post("/api/retirement/check-notifications", requireAdmin, async (_req, res) => {
    try {
      const allEmployees = await storage.getEmployees();
      const existingNotifs = await storage.getNotifications();
      const RETIREMENT_AGE = 58;
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const createdNotifs: string[] = [];

      for (const emp of allEmployees) {
        if (emp.status !== "aktif" || !emp.birthDate) continue;
        const birth = new Date(emp.birthDate);
        const retDate = new Date(birth.getFullYear() + RETIREMENT_AGE, birth.getMonth(), birth.getDate());
        const remainDays = Math.ceil((retDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        if (remainDays <= 0) continue;

        let shouldNotify = false;
        let urgency = "";

        if (remainDays <= 7) {
          shouldNotify = true;
          urgency = "URGENT";
        } else if (remainDays <= 30) {
          shouldNotify = true;
          urgency = "SEGERA";
        } else if (remainDays <= 90) {
          shouldNotify = true;
          urgency = "H-3 Bulan";
        } else if (remainDays <= 180) {
          shouldNotify = true;
          urgency = "H-6 Bulan";
        } else if (remainDays <= 365) {
          shouldNotify = true;
          urgency = "H-1 Tahun";
        }

        if (shouldNotify) {
          const dedupeKey = `Pensiun: ${emp.fullName}`;
          const alreadyNotified = existingNotifs.some(n =>
            n.title.includes(dedupeKey) &&
            n.createdAt && new Date(n.createdAt).toISOString().slice(0, 10) === today
          );
          if (alreadyNotified) continue;

          const retDateStr = retDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
          await storage.createNotification({
            title: `[${urgency}] Pensiun: ${emp.fullName}`,
            message: `${emp.fullName} (${emp.nip}) akan pensiun pada ${retDateStr} (${remainDays} hari lagi)`,
            type: remainDays <= 90 ? "urgent" : "warning",
            link: `/employees/${emp.id}`,
          });
          createdNotifs.push(`${emp.fullName} - ${remainDays} hari`);
        }
      }
      res.json({ success: true, notificationsCreated: createdNotifs.length, details: createdNotifs });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/rank-promotions", async (_req, res) => {
    const data = await storage.getRankPromotions();
    res.json(data);
  });
  app.get("/api/rank-promotions/employee/:id", async (req, res) => {
    const data = await storage.getRankPromotionsByEmployee(parseInt(req.params.id));
    res.json(data);
  });
  app.post("/api/rank-promotions", async (req, res) => {
    try {
      const data = await storage.createRankPromotion(req.body);
      await storage.createApprovalLog({
        entityType: "rank_promotion",
        entityId: data.id,
        action: "submit",
        performedBy: req.session.userId || "system",
        notes: "Pengajuan kenaikan pangkat dibuat",
      });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  app.put("/api/rank-promotions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getRankPromotions();
      const current = existing.find(rp => rp.id === id);
      if (!current) return res.status(404).json({ message: "Not found" });

      const validTransitions: Record<string, string[]> = {
        diajukan: ["review_hrd", "rejected"],
        review_hrd: ["review_kabag", "rejected"],
        review_kabag: ["approval_direktur", "rejected"],
        approval_direktur: ["rejected"],
      };

      if (req.body.status) {
        if (req.body.status === "approved") {
          return res.status(403).json({ message: "Gunakan endpoint /approve untuk menyetujui" });
        }
        const allowed = validTransitions[current.status] || [];
        if (!allowed.includes(req.body.status)) {
          return res.status(400).json({ message: `Transisi status dari ${current.status} ke ${req.body.status} tidak valid` });
        }
      }

      const data = await storage.updateRankPromotion(id, req.body);
      if (req.body.status) {
        const action = req.body.status === "rejected" ? "reject" : "review";
        await storage.createApprovalLog({
          entityType: "rank_promotion",
          entityId: id,
          action,
          performedBy: req.session.userId || "system",
          notes: req.body.rejectionReason || `Status diubah ke ${req.body.status}`,
        });
      }
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  app.put("/api/rank-promotions/:id/approve", requireDirektur, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = await storage.updateRankPromotion(id, {
        status: "approved",
        approvedBy: req.session.userId,
        approvedAt: new Date(),
        promotionDate: new Date().toISOString().split('T')[0],
      } as any);
      await storage.createApprovalLog({
        entityType: "rank_promotion",
        entityId: id,
        action: "approve",
        performedBy: req.session.userId || "system",
        notes: req.body.notes || "Disetujui oleh Direktur",
      });
      if (data.employeeId) {
        await storage.updateEmployee(data.employeeId, {
          grade: data.toGrade,
          lastPromotionDate: new Date().toISOString().split('T')[0],
        });
      }
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/salary-increases", async (_req, res) => {
    const data = await storage.getSalaryIncreases();
    res.json(data);
  });
  app.get("/api/salary-increases/employee/:id", async (req, res) => {
    const data = await storage.getSalaryIncreasesByEmployee(parseInt(req.params.id));
    res.json(data);
  });
  app.post("/api/salary-increases", async (req, res) => {
    try {
      const data = await storage.createSalaryIncrease(req.body);
      await storage.createApprovalLog({
        entityType: "salary_increase",
        entityId: data.id,
        action: "submit",
        performedBy: req.session.userId || "system",
        notes: "Pengajuan kenaikan gaji dibuat",
      });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  app.put("/api/salary-increases/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getSalaryIncreases();
      const current = existing.find(si => si.id === id);
      if (!current) return res.status(404).json({ message: "Not found" });

      if (req.body.status) {
        if (req.body.status === "approved") {
          return res.status(403).json({ message: "Gunakan endpoint /approve untuk menyetujui" });
        }
        const validTransitions: Record<string, string[]> = {
          pending: ["review", "rejected"],
          review: ["rejected"],
        };
        const allowed = validTransitions[current.status] || [];
        if (!allowed.includes(req.body.status)) {
          return res.status(400).json({ message: `Transisi status dari ${current.status} ke ${req.body.status} tidak valid` });
        }
      }

      const data = await storage.updateSalaryIncrease(id, req.body);
      if (req.body.status) {
        const action = req.body.status === "rejected" ? "reject" : "review";
        await storage.createApprovalLog({
          entityType: "salary_increase",
          entityId: id,
          action,
          performedBy: req.session.userId || "system",
          notes: req.body.rejectionReason || `Status diubah ke ${req.body.status}`,
        });
      }
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  app.put("/api/salary-increases/:id/approve", requireDirektur, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = await storage.updateSalaryIncrease(id, {
        status: "approved",
        approvedBy: req.session.userId,
        approvedAt: new Date(),
      } as any);
      await storage.createApprovalLog({
        entityType: "salary_increase",
        entityId: id,
        action: "approve",
        performedBy: req.session.userId || "system",
        notes: req.body.notes || "Disetujui oleh Direktur",
      });
      if (data.employeeId) {
        await storage.updateEmployee(data.employeeId, {
          lastSalaryIncreaseDate: new Date().toISOString().split('T')[0],
        });
      }
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/approval-logs", async (req, res) => {
    const entityType = typeof req.query.entityType === "string" ? req.query.entityType : undefined;
    const entityId = typeof req.query.entityId === "string" ? parseInt(req.query.entityId) : undefined;
    const data = await storage.getApprovalLogs(entityType, entityId);
    res.json(data);
  });

  app.get("/api/eligible-promotions", async (_req, res) => {
    const data = await storage.getEligibleForPromotion();
    res.json(data);
  });

  app.get("/api/eligible-salary-increases", async (_req, res) => {
    const data = await storage.getEligibleForSalaryIncrease();
    res.json(data);
  });

  // Serve uploaded files
  app.use("/uploads", requireAuth, (await import("express")).default.static(uploadsDir));

  // Photo upload
  app.post("/api/employees/:id/photo", requireAdmin, uploadPhoto.single("photo"), async (req, res) => {
    try {
      const empId = parseInt(req.params.id);
      const file = req.file;
      if (!file) return res.status(400).json({ message: "File foto diperlukan" });
      const photoUrl = `/uploads/photos/${file.filename}`;
      await storage.updateEmployee(empId, { photoUrl } as any);
      res.json({ success: true, photoUrl });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Document (SK) upload
  app.post("/api/employees/:id/documents", requireAdmin, uploadDoc.single("document"), async (req, res) => {
    try {
      const empId = parseInt(req.params.id);
      const file = req.file;
      if (!file) return res.status(400).json({ message: "File dokumen diperlukan" });
      const fileUrl = `/uploads/documents/${file.filename}`;
      const doc = await storage.createDocument({
        employeeId: empId,
        title: req.body.title || file.originalname,
        category: req.body.category || "SK",
        description: req.body.description || null,
        fileUrl,
        uploadedBy: String(req.session.userId || "admin"),
      });
      res.json(doc);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Delete document
  app.delete("/api/documents/:id", requireAdmin, async (req, res) => {
    try {
      const docId = parseInt(req.params.id);
      await storage.deleteDocument(docId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Attendance CSV/Excel import
  app.post("/api/attendance/import", requireAdmin, uploadAttendance.single("file"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ message: "File diperlukan" });

      const fileExt = path.extname(file.originalname).toLowerCase();
      const employees = await storage.getEmployees();
      const results: any[] = [];
      const errors: string[] = [];
      let dataLines: any[] = [];

      if (fileExt === ".csv") {
        const content = fs.readFileSync(file.path, "utf-8");
        const lines = content.split("\n").filter(l => l.trim());
        dataLines = lines.slice(1).map(line => line.split(",").map(c => c.trim().replace(/"/g, "")));
      } else if (fileExt === ".xlsx" || fileExt === ".xls") {
        const XLSX = await import("xlsx");
        const workbook = XLSX.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, raw: true });
        dataLines = jsonData.slice(1).filter((row: any[]) => row.length >= 4);
      } else {
        fs.unlinkSync(file.path);
        return res.status(400).json({ message: "Format file tidak didukung. Gunakan CSV atau Excel (.xlsx/.xls)" });
      }

      for (let i = 0; i < dataLines.length; i++) {
        let cols = dataLines[i];
        if (cols.length < 4) {
          errors.push(`Baris ${i + 2}: Format tidak valid (butuh NIP,Tanggal,JamMasuk,JamKeluar)`);
          continue;
        }

        let nip = String(cols[0]).trim();
        
        let dateVal = cols[1];
        let dateStr = "";
        if (typeof dateVal === 'number') {
          const dateObj = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
          if (!isNaN(dateObj.getTime())) dateStr = dateObj.toISOString().split('T')[0];
          else dateStr = String(dateVal);
        } else {
          dateStr = String(dateVal).trim();
          if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const parsed = new Date(dateStr);
            if (!isNaN(parsed.getTime())) dateStr = parsed.toISOString().split('T')[0];
          }
        }

        const formatTime = (val: any) => {
          if (!val && val !== 0) return "";
          if (typeof val === 'number') {
            const totalSeconds = Math.round(val * 86400);
            const h = Math.floor(totalSeconds / 3600);
            const m = Math.floor((totalSeconds % 3600) / 60);
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          }
          let str = String(val).trim();
          if (str.length === 4 && !str.includes(":")) {
             // Handle 0800 format
             return `${str.slice(0, 2)}:${str.slice(2, 4)}`;
          }
          return str;
        };

        let checkIn = formatTime(cols[2]);
        let checkOut = formatTime(cols[3]);
        
        const emp = employees.find(e => e.nip === nip);
        if (!emp) {
          errors.push(`Baris ${i + 2}: NIP ${nip} tidak ditemukan`);
          continue;
        }

        // Calculate late minutes (after 07:30)
        let lateMinutes = 0;
        if (checkIn) {
          const [h, m] = checkIn.split(":").map(Number);
          if (h > 7 || (h === 7 && m > 30)) {
            lateMinutes = (h - 7) * 60 + (m - 30);
          }
        }

        try {
          const record = await storage.createAttendance({
            employeeId: emp.id,
            date: dateStr,
            checkIn: checkIn || null,
            checkOut: checkOut || null,
            status: "hadir",
            lateMinutes,
            notes: "Import fingerprint",
          });
          results.push(record);
        } catch (e: any) {
          errors.push(`Baris ${i + 2}: ${e.message}`);
        }
      }

      // Clean up uploaded file
      fs.unlinkSync(file.path);

      res.json({
        success: true,
        imported: results.length,
        errors: errors.length,
        errorDetails: errors.slice(0, 10),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/dashboard/alerts", requireAdmin, async (_req, res) => {
    try {
      const promote = await storage.getEligibleForPromotion();
      const salary = await storage.getEligibleForSalaryIncrease();
      res.json({ promote, salary });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
