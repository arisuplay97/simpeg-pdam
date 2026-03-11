import { eq, desc, sql, and, gte, lte, like, count, isNull, or } from "drizzle-orm";
import { db } from "./db";
import {
  departments, positions, employees, attendance, leaveRequests,
  payroll, payrollDeductions, financeTransactions, performanceReviews, mutations,
  trainings, documents, notifications, users,
  rankPromotions, salaryIncreases, payslipLogs, approvalLogs, exportLogs,
  type InsertDepartment, type InsertPosition, type InsertEmployee,
  type InsertAttendance, type InsertLeaveRequest, type InsertPayroll,
  type InsertPayrollDeduction, type InsertPayslipLog, type InsertExportLog,
  type InsertFinanceTransaction, type InsertPerformanceReview,
  type InsertMutation, type InsertTraining, type InsertDocument,
  type InsertNotification, type InsertUser,
  type InsertRankPromotion, type InsertSalaryIncrease, type InsertApprovalLog,
  type Department, type Position, type Employee, type Attendance,
  type LeaveRequest, type Payroll, type PayrollDeduction, type FinanceTransaction,
  type PerformanceReview, type Mutation, type Training, type Document,
  type Notification, type User,
  type RankPromotion, type SalaryIncrease, type PayslipLog, type ApprovalLog, type ExportLog,
} from "@shared/schema";

export const storage = {
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  },
  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  },
  async createUser(data: InsertUser & { password: string }): Promise<User> {
    const [result] = await db.insert(users).values(data).returning();
    return result;
  },
  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  },

  async getDepartments(): Promise<Department[]> {
    return db.select().from(departments).orderBy(departments.name);
  },
  async createDepartment(data: InsertDepartment): Promise<Department> {
    const [result] = await db.insert(departments).values(data).returning();
    return result;
  },

  async getPositions(): Promise<Position[]> {
    return db.select().from(positions).orderBy(positions.name);
  },
  async createPosition(data: InsertPosition): Promise<Position> {
    const [result] = await db.insert(positions).values(data).returning();
    return result;
  },

  async getEmployees(): Promise<Employee[]> {
    return db.select().from(employees).orderBy(employees.fullName);
  },
  async getEmployee(id: number): Promise<Employee | undefined> {
    const [result] = await db.select().from(employees).where(eq(employees.id, id));
    return result;
  },
  async createEmployee(data: InsertEmployee): Promise<Employee> {
    const [result] = await db.insert(employees).values(data).returning();
    return result;
  },
  async updateEmployee(id: number, data: Partial<InsertEmployee>): Promise<Employee> {
    const [result] = await db.update(employees).set(data).where(eq(employees.id, id)).returning();
    return result;
  },
  async deleteEmployee(id: number): Promise<void> {
    await db.delete(employees).where(eq(employees.id, id));
  },

  async getAttendance(dateFilter?: string): Promise<Attendance[]> {
    if (dateFilter) {
      return db.select().from(attendance).where(eq(attendance.date, dateFilter)).orderBy(desc(attendance.id));
    }
    return db.select().from(attendance).orderBy(desc(attendance.id)).limit(200);
  },
  async getAttendanceByEmployee(employeeId: number): Promise<Attendance[]> {
    return db.select().from(attendance).where(eq(attendance.employeeId, employeeId)).orderBy(desc(attendance.date));
  },
  async createAttendance(data: InsertAttendance): Promise<Attendance> {
    const [result] = await db.insert(attendance).values(data).returning();
    return result;
  },
  async updateAttendance(id: number, data: Partial<InsertAttendance>): Promise<Attendance> {
    const [result] = await db.update(attendance).set(data).where(eq(attendance.id, id)).returning();
    return result;
  },

  async getLeaveRequests(): Promise<LeaveRequest[]> {
    return db.select().from(leaveRequests).orderBy(desc(leaveRequests.createdAt));
  },
  async getLeaveRequestsByEmployee(employeeId: number): Promise<LeaveRequest[]> {
    return db.select().from(leaveRequests).where(eq(leaveRequests.employeeId, employeeId)).orderBy(desc(leaveRequests.createdAt));
  },
  async createLeaveRequest(data: InsertLeaveRequest): Promise<LeaveRequest> {
    const [result] = await db.insert(leaveRequests).values(data).returning();
    return result;
  },
  async updateLeaveRequest(id: number, data: Partial<InsertLeaveRequest>): Promise<LeaveRequest> {
    const [result] = await db.update(leaveRequests).set(data).where(eq(leaveRequests.id, id)).returning();
    return result;
  },

  async getPayroll(period?: string): Promise<Payroll[]> {
    if (period) {
      return db.select().from(payroll).where(eq(payroll.period, period)).orderBy(desc(payroll.id));
    }
    return db.select().from(payroll).orderBy(desc(payroll.id)).limit(200);
  },
  async getPayrollByEmployee(employeeId: number): Promise<Payroll[]> {
    return db.select().from(payroll).where(eq(payroll.employeeId, employeeId)).orderBy(desc(payroll.period));
  },
  async createPayroll(data: InsertPayroll): Promise<Payroll> {
    const [result] = await db.insert(payroll).values(data).returning();
    return result;
  },
  async getPayrollById(id: number): Promise<Payroll | undefined> {
    const [result] = await db.select().from(payroll).where(eq(payroll.id, id));
    return result;
  },
  async getPayrollDeductionById(id: number): Promise<PayrollDeduction | undefined> {
    const [result] = await db.select().from(payrollDeductions).where(eq(payrollDeductions.id, id));
    return result;
  },
  async updatePayroll(id: number, data: Partial<InsertPayroll>): Promise<Payroll> {
    const [result] = await db.update(payroll).set(data).where(eq(payroll.id, id)).returning();
    return result;
  },

  async getPayrollDeductions(payrollId: number): Promise<PayrollDeduction[]> {
    return db.select().from(payrollDeductions).where(eq(payrollDeductions.payrollId, payrollId)).orderBy(payrollDeductions.type);
  },
  async createPayrollDeduction(data: InsertPayrollDeduction): Promise<PayrollDeduction> {
    const [result] = await db.insert(payrollDeductions).values(data).returning();
    return result;
  },
  async deletePayroll(id: number): Promise<void> {
    await db.delete(payrollDeductions).where(eq(payrollDeductions.payrollId, id));
    await db.delete(payroll).where(eq(payroll.id, id));
  },
  async deletePayrollDeduction(id: number): Promise<void> {
    await db.delete(payrollDeductions).where(eq(payrollDeductions.id, id));
  },

  async getFinanceTransactions(): Promise<FinanceTransaction[]> {
    return db.select().from(financeTransactions).orderBy(desc(financeTransactions.date));
  },
  async createFinanceTransaction(data: InsertFinanceTransaction): Promise<FinanceTransaction> {
    const [result] = await db.insert(financeTransactions).values(data).returning();
    return result;
  },
  async updateFinanceTransaction(id: number, data: Partial<InsertFinanceTransaction>): Promise<FinanceTransaction> {
    const [result] = await db.update(financeTransactions).set(data).where(eq(financeTransactions.id, id)).returning();
    return result;
  },

  async getPerformanceReviews(): Promise<PerformanceReview[]> {
    return db.select().from(performanceReviews).orderBy(desc(performanceReviews.createdAt));
  },
  async getPerformanceByEmployee(employeeId: number): Promise<PerformanceReview[]> {
    return db.select().from(performanceReviews).where(eq(performanceReviews.employeeId, employeeId)).orderBy(desc(performanceReviews.period));
  },
  async createPerformanceReview(data: InsertPerformanceReview): Promise<PerformanceReview> {
    const [result] = await db.insert(performanceReviews).values(data).returning();
    return result;
  },

  async getMutations(): Promise<Mutation[]> {
    return db.select().from(mutations).orderBy(desc(mutations.createdAt));
  },
  async getMutationsByEmployee(employeeId: number): Promise<Mutation[]> {
    return db.select().from(mutations).where(eq(mutations.employeeId, employeeId)).orderBy(desc(mutations.effectiveDate));
  },
  async createMutation(data: InsertMutation): Promise<Mutation> {
    const [result] = await db.insert(mutations).values(data).returning();
    return result;
  },
  async updateMutation(id: number, data: Partial<InsertMutation>): Promise<Mutation> {
    const [result] = await db.update(mutations).set(data).where(eq(mutations.id, id)).returning();
    return result;
  },

  async getTrainings(): Promise<Training[]> {
    return db.select().from(trainings).orderBy(desc(trainings.startDate));
  },
  async createTraining(data: InsertTraining): Promise<Training> {
    const [result] = await db.insert(trainings).values(data).returning();
    return result;
  },

  async getDocuments(): Promise<Document[]> {
    return db.select().from(documents).orderBy(desc(documents.createdAt));
  },
  async getDocumentsByEmployee(employeeId: number): Promise<Document[]> {
    return db.select().from(documents).where(eq(documents.employeeId, employeeId)).orderBy(desc(documents.createdAt));
  },
  async createDocument(data: InsertDocument): Promise<Document> {
    const [result] = await db.insert(documents).values(data).returning();
    return result;
  },

  async getNotifications(): Promise<Notification[]> {
    return db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(50);
  },
  async createNotification(data: InsertNotification): Promise<Notification> {
    const [result] = await db.insert(notifications).values(data).returning();
    return result;
  },
  async markNotificationRead(id: number): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  },

  async getRankPromotions(): Promise<RankPromotion[]> {
    return db.select().from(rankPromotions).orderBy(desc(rankPromotions.createdAt));
  },
  async getRankPromotionsByEmployee(employeeId: number): Promise<RankPromotion[]> {
    return db.select().from(rankPromotions).where(eq(rankPromotions.employeeId, employeeId)).orderBy(desc(rankPromotions.createdAt));
  },
  async createRankPromotion(data: InsertRankPromotion): Promise<RankPromotion> {
    const [result] = await db.insert(rankPromotions).values(data).returning();
    return result;
  },
  async updateRankPromotion(id: number, data: Partial<InsertRankPromotion>): Promise<RankPromotion> {
    const [result] = await db.update(rankPromotions).set(data).where(eq(rankPromotions.id, id)).returning();
    return result;
  },

  async getSalaryIncreases(): Promise<SalaryIncrease[]> {
    return db.select().from(salaryIncreases).orderBy(desc(salaryIncreases.createdAt));
  },
  async getSalaryIncreasesByEmployee(employeeId: number): Promise<SalaryIncrease[]> {
    return db.select().from(salaryIncreases).where(eq(salaryIncreases.employeeId, employeeId)).orderBy(desc(salaryIncreases.createdAt));
  },
  async createSalaryIncrease(data: InsertSalaryIncrease): Promise<SalaryIncrease> {
    const [result] = await db.insert(salaryIncreases).values(data).returning();
    return result;
  },
  async updateSalaryIncrease(id: number, data: Partial<InsertSalaryIncrease>): Promise<SalaryIncrease> {
    const [result] = await db.update(salaryIncreases).set(data).where(eq(salaryIncreases.id, id)).returning();
    return result;
  },

  async getApprovalLogs(entityType?: string, entityId?: number): Promise<ApprovalLog[]> {
    if (entityType && entityId) {
      return db.select().from(approvalLogs)
        .where(and(eq(approvalLogs.entityType, entityType), eq(approvalLogs.entityId, entityId)))
        .orderBy(desc(approvalLogs.createdAt));
    }
    return db.select().from(approvalLogs).orderBy(desc(approvalLogs.createdAt)).limit(200);
  },
  async createApprovalLog(data: InsertApprovalLog): Promise<ApprovalLog> {
    const [result] = await db.insert(approvalLogs).values(data).returning();
    return result;
  },

  async createExportLog(data: InsertExportLog): Promise<ExportLog> {
    const [result] = await db.insert(exportLogs).values(data).returning();
    return result;
  },

  async createPayslipLog(data: InsertPayslipLog): Promise<PayslipLog> {
    const [result] = await db.insert(payslipLogs).values(data).returning();
    return result;
  },

  async getEligibleForPromotion(): Promise<Employee[]> {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 4);
    cutoffDate.setMonth(cutoffDate.getMonth() + 3);
    const cutoff = cutoffDate.toISOString().split('T')[0];

    return db.select().from(employees)
      .where(
        and(
          eq(employees.status, "aktif"),
          or(
            and(
              isNull(employees.lastPromotionDate),
              lte(employees.joinDate, cutoff)
            ),
            lte(employees.lastPromotionDate, cutoff)
          )
        )
      )
      .orderBy(employees.fullName);
  },

  async getEligibleForSalaryIncrease(): Promise<Employee[]> {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 2);
    cutoffDate.setMonth(cutoffDate.getMonth() + 3);
    const cutoff = cutoffDate.toISOString().split('T')[0];

    return db.select().from(employees)
      .where(
        and(
          eq(employees.status, "aktif"),
          or(
            and(
              isNull(employees.lastSalaryIncreaseDate),
              lte(employees.joinDate, cutoff)
            ),
            lte(employees.lastSalaryIncreaseDate, cutoff)
          )
        )
      )
      .orderBy(employees.fullName);
  },

  async getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];

    const [totalEmployees] = await db.select({ count: count() }).from(employees);
    const [activeEmployees] = await db.select({ count: count() }).from(employees).where(eq(employees.status, "aktif"));
    const [contractEmployees] = await db.select({ count: count() }).from(employees).where(eq(employees.employeeType, "kontrak"));
    const [todayAttendance] = await db.select({ count: count() }).from(attendance).where(and(eq(attendance.date, today), eq(attendance.status, "hadir")));
    const [lateToday] = await db.select({ count: count() }).from(attendance).where(and(eq(attendance.date, today), sql`${attendance.lateMinutes} > 0`));
    const [pendingLeave] = await db.select({ count: count() }).from(leaveRequests).where(eq(leaveRequests.status, "pending"));
    const [activeLeave] = await db.select({ count: count() }).from(leaveRequests).where(eq(leaveRequests.status, "approved"));
    const [pendingPromotions] = await db.select({ count: count() }).from(rankPromotions).where(
      and(
        sql`${rankPromotions.status} != 'approved'`,
        sql`${rankPromotions.status} != 'rejected'`
      )
    );
    const [pendingSalaryIncreases] = await db.select({ count: count() }).from(salaryIncreases).where(
      and(
        sql`${salaryIncreases.status} != 'approved'`,
        sql`${salaryIncreases.status} != 'rejected'`
      )
    );

    return {
      totalEmployees: totalEmployees.count,
      activeEmployees: activeEmployees.count,
      contractEmployees: contractEmployees.count,
      todayAttendance: todayAttendance.count,
      lateToday: lateToday.count,
      pendingLeave: pendingLeave.count,
      activeLeave: activeLeave.count,
      pendingPromotions: pendingPromotions.count,
      pendingSalaryIncreases: pendingSalaryIncreases.count,
    };
  },
};
