import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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

  return httpServer;
}
