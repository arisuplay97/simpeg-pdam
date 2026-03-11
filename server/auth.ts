import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { storage } from "./storage";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

declare module "express-session" {
  interface SessionData {
    userId: string;
    role: string;
    employeeId: number | null;
  }
}

const isSuperAdmin = (role: string) => role === "superadmin";
const isAdminLevel = (role: string) => role === "admin" || role === "superadmin";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!isAdminLevel(req.session.role || "")) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

export function requireDirektur(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const role = req.session.role || "";
  if (role !== "direktur" && !isAdminLevel(role)) {
    return res.status(403).json({ message: "Forbidden - Direktur access required" });
  }
  next();
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!isSuperAdmin(req.session.role || "")) {
    return res.status(403).json({ message: "Forbidden - Super Admin access required" });
  }
  next();
}
