import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, comparePassword, requireAuth, requireDirektur } from "./auth";

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
  app.use("/api/departments", requireAuth);
  app.use("/api/positions", requireAuth);
  app.use("/api/employees", requireAuth);
  app.use("/api/attendance", requireAuth);
  app.use("/api/leave-requests", requireAuth);
  app.use("/api/payroll", requireAuth);
  app.use("/api/finance", requireAuth);
  app.use("/api/performance", requireAuth);
  app.use("/api/mutations", requireAuth);
  app.use("/api/trainings", requireAuth);
  app.use("/api/documents", requireAuth);
  app.use("/api/notifications", requireAuth);
  app.use("/api/rank-promotions", requireAuth);
  app.use("/api/salary-increases", requireAuth);
  app.use("/api/approval-logs", requireAuth);
  app.use("/api/eligible-promotions", requireAuth);
  app.use("/api/eligible-salary-increases", requireAuth);

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
  app.delete("/api/employees/:id", async (req, res) => {
    await storage.deleteEmployee(parseInt(req.params.id));
    res.json({ success: true });
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

  app.get("/api/finance", async (_req, res) => {
    const data = await storage.getFinanceTransactions();
    res.json(data);
  });
  app.post("/api/finance", async (req, res) => {
    const data = await storage.createFinanceTransaction(req.body);
    res.json(data);
  });
  app.put("/api/finance/:id", async (req, res) => {
    const data = await storage.updateFinanceTransaction(parseInt(req.params.id), req.body);
    res.json(data);
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

  return httpServer;
}
