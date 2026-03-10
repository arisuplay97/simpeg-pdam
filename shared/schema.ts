import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, date, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const departments = pgTable("departments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  headName: text("head_name"),
  description: text("description"),
});

export const positions = pgTable("positions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  level: text("level").notNull(),
  departmentId: integer("department_id").references(() => departments.id),
});

export const employees = pgTable("employees", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nip: text("nip").notNull().unique(),
  fullName: text("full_name").notNull(),
  gender: text("gender").notNull(),
  birthPlace: text("birth_place"),
  birthDate: date("birth_date"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  religion: text("religion"),
  education: text("education"),
  departmentId: integer("department_id").references(() => departments.id),
  positionId: integer("position_id").references(() => positions.id),
  status: text("status").notNull().default("aktif"),
  employeeType: text("employee_type").notNull().default("tetap"),
  grade: text("grade"),
  joinDate: date("join_date").notNull(),
  npwp: text("npwp"),
  bpjs: text("bpjs"),
  bankAccount: text("bank_account"),
  bankName: text("bank_name"),
  maritalStatus: text("marital_status"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const attendance = pgTable("attendance", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  date: date("date").notNull(),
  checkIn: text("check_in"),
  checkOut: text("check_out"),
  status: text("status").notNull().default("hadir"),
  lateMinutes: integer("late_minutes").default(0),
  earlyLeaveMinutes: integer("early_leave_minutes").default(0),
  overtimeHours: decimal("overtime_hours", { precision: 4, scale: 2 }).default("0"),
  notes: text("notes"),
});

export const leaveRequests = pgTable("leave_requests", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  type: text("type").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  days: integer("days").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("pending"),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payroll = pgTable("payroll", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  period: text("period").notNull(),
  basicSalary: decimal("basic_salary", { precision: 12, scale: 2 }).notNull(),
  positionAllowance: decimal("position_allowance", { precision: 12, scale: 2 }).default("0"),
  familyAllowance: decimal("family_allowance", { precision: 12, scale: 2 }).default("0"),
  transportAllowance: decimal("transport_allowance", { precision: 12, scale: 2 }).default("0"),
  mealAllowance: decimal("meal_allowance", { precision: 12, scale: 2 }).default("0"),
  overtime: decimal("overtime", { precision: 12, scale: 2 }).default("0"),
  incentive: decimal("incentive", { precision: 12, scale: 2 }).default("0"),
  bpjsDeduction: decimal("bpjs_deduction", { precision: 12, scale: 2 }).default("0"),
  taxDeduction: decimal("tax_deduction", { precision: 12, scale: 2 }).default("0"),
  otherDeduction: decimal("other_deduction", { precision: 12, scale: 2 }).default("0"),
  totalEarnings: decimal("total_earnings", { precision: 12, scale: 2 }).notNull(),
  totalDeductions: decimal("total_deductions", { precision: 12, scale: 2 }).notNull(),
  netSalary: decimal("net_salary", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const financeTransactions = pgTable("finance_transactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  type: text("type").notNull(),
  category: text("category").notNull(),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
  description: text("description").notNull(),
  date: date("date").notNull(),
  status: text("status").notNull().default("pending"),
  approvedBy: text("approved_by"),
  reference: text("reference"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const performanceReviews = pgTable("performance_reviews", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  period: text("period").notNull(),
  reviewType: text("review_type").notNull(),
  discipline: integer("discipline").default(0),
  attendance: integer("attendance_score").default(0),
  productivity: integer("productivity").default(0),
  teamwork: integer("teamwork").default(0),
  initiative: integer("initiative").default(0),
  totalScore: integer("total_score").default(0),
  grade: text("grade"),
  notes: text("notes"),
  reviewerName: text("reviewer_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mutations = pgTable("mutations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  type: text("type").notNull(),
  fromPosition: text("from_position"),
  toPosition: text("to_position"),
  fromDepartment: text("from_department"),
  toDepartment: text("to_department"),
  effectiveDate: date("effective_date").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("pending"),
  skNumber: text("sk_number"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const trainings = pgTable("trainings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  description: text("description"),
  trainer: text("trainer"),
  location: text("location"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  departmentId: integer("department_id").references(() => departments.id),
  maxParticipants: integer("max_participants"),
  status: text("status").notNull().default("upcoming"),
  participants: text("participants").array(),
});

export const documents = pgTable("documents", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  employeeId: integer("employee_id").references(() => employees.id),
  title: text("title").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  fileUrl: text("file_url"),
  uploadedBy: text("uploaded_by"),
  expiryDate: date("expiry_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  isRead: boolean("is_read").default(false),
  link: text("link"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("pegawai"),
  employeeId: integer("employee_id").references(() => employees.id),
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true });
export const insertPositionSchema = createInsertSchema(positions).omit({ id: true });
export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true, createdAt: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).omit({ id: true, createdAt: true, approvedAt: true });
export const insertPayrollSchema = createInsertSchema(payroll).omit({ id: true, createdAt: true });
export const insertFinanceTransactionSchema = createInsertSchema(financeTransactions).omit({ id: true, createdAt: true });
export const insertPerformanceReviewSchema = createInsertSchema(performanceReviews).omit({ id: true, createdAt: true });
export const insertMutationSchema = createInsertSchema(mutations).omit({ id: true, createdAt: true });
export const insertTrainingSchema = createInsertSchema(trainings).omit({ id: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).pick({ username: true, password: true, role: true, employeeId: true });

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Position = typeof positions.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;
export type Payroll = typeof payroll.$inferSelect;
export type InsertPayroll = z.infer<typeof insertPayrollSchema>;
export type FinanceTransaction = typeof financeTransactions.$inferSelect;
export type InsertFinanceTransaction = z.infer<typeof insertFinanceTransactionSchema>;
export type PerformanceReview = typeof performanceReviews.$inferSelect;
export type InsertPerformanceReview = z.infer<typeof insertPerformanceReviewSchema>;
export type Mutation = typeof mutations.$inferSelect;
export type InsertMutation = z.infer<typeof insertMutationSchema>;
export type Training = typeof trainings.$inferSelect;
export type InsertTraining = z.infer<typeof insertTrainingSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
