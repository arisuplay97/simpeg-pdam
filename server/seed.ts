import * as dotenv from 'dotenv';
dotenv.config();
import { db } from "./db";
import {
  departments, positions, employees, attendance, leaveRequests,
  payroll, payrollDeductions, financeTransactions, performanceReviews, mutations,
  trainings, documents, notifications, users, branches, subDepartments,
  rankPromotions, salaryIncreases, approvalLogs
} from "@shared/schema";
import { count, eq } from "drizzle-orm";
import { hashPassword } from "./auth";

async function clearDatabase() {
  await db.delete(notifications);
  await db.delete(approvalLogs);
  await db.delete(salaryIncreases);
  await db.delete(rankPromotions);
  await db.delete(trainings);
  await db.delete(performanceReviews);
  await db.delete(financeTransactions);
  await db.delete(payrollDeductions);
  await db.delete(payroll);
  await db.delete(leaveRequests);
  await db.delete(attendance);
  await db.delete(users);
  await db.delete(mutations);
  await db.delete(documents);
  await db.delete(employees);
  await db.delete(positions);
  await db.delete(subDepartments);
  await db.delete(branches);
  await db.delete(departments);
}

export async function seedDatabase() {
  await clearDatabase(); // Start fresh due to structural changes

  // 1. Insert 9 Bidang Pusat
  const deptData = await db.insert(departments).values([
    { name: "Sekper", code: "SEK", headName: "Bambang Purnomo, S.H.", description: "Sekretariat Perusahaan" },
    { name: "Keuangan", code: "KEU", headName: "Dra. Siti Rahayu", description: "Manajemen keuangan dan akuntansi" },
    { name: "Hublang", code: "HBL", headName: "Ni Luh Ketut Sari", description: "Hubungan Langganan / Pelayanan pelanggan" },
    { name: "SPI", code: "SPI", headName: "Hj. Fatimah Azzahra", description: "Satuan Pengawas Internal" },
    { name: "Umum", code: "UMM", headName: "Dewi Anggraini", description: "Bagian Umum & administrasi" },
    { name: "Perawatan", code: "PRW", headName: "Ir. Ahmad Suryadi", description: "Perawatan jaringan & infrastruktur" },
    { name: "Produksi", code: "PRO", headName: "Dr. Made Suartana", description: "Produksi & pengolahan air bersih" },
    { name: "Transdit", code: "TRD", headName: "Ir. Wayan Dharma", description: "Transmisi & Distribusi" },
    { name: "Perencana", code: "PRC", headName: "Rahmat Hidayatullah", description: "Perencanaan & pengembangan" },
  ]).returning();

  // 2. Insert 12 Cabang
  const branchNames = [
    "Cabang Praya", "Cabang Praya Barat", "Cabang Praya Timur", 
    "Cabang Praya Tengah", "Cabang Pujut", "Cabang Kopang", 
    "Cabang Jonggat", "Cabang Janapria", "Cabang Pringgarata", 
    "Cabang Batukliang", "Cabang Batukliang Utara", "Cabang Prabarda"
  ];
  const branchInserts = branchNames.map(name => ({
    name,
    address: `Jl. Raya ${name}, Lombok Tengah`,
    phone: `081234${Math.floor(100000 + Math.random() * 900000)}`
  }));
  const branchData = await db.insert(branches).values(branchInserts).returning();

  // 3. Insert Sub-Bidang
  const subDeptData = await db.insert(subDepartments).values([
    { name: "Sub Bidang Akuntansi", departmentId: deptData[1].id, branchId: null },
    { name: "Sub Bidang Kas", departmentId: deptData[1].id, branchId: null },
    { name: "Bagian Administrasi & Keuangan", departmentId: null, branchId: branchData[0].id },
    { name: "Bagian Teknik", departmentId: null, branchId: branchData[0].id },
  ]).returning();

  // 4. Insert Positions
  const posData = await db.insert(positions).values([
    { name: "Direktur Utama", level: "Direksi", departmentId: null },
    { name: "Kepala Bidang", level: "Eselon III", departmentId: deptData[0].id },
    { name: "Kepala Cabang", level: "Eselon III", departmentId: null },
    { name: "Kepala Sub Bidang", level: "Eselon IV", departmentId: deptData[1].id },
    { name: "Staff Senior", level: "Staff", departmentId: deptData[0].id },
    { name: "Staff Operasional", level: "Staff", departmentId: null },
  ]).returning();

  // 5. Insert Employees
  const empData = await db.insert(employees).values([
    // DIREKTUR (Pusat) - index 0
    { nip: "PDAM-DIR", fullName: "H. Doni Alga, S.E., M.M.", gender: "Laki-laki", officeType: "pusat", structuralPosition: "direktur_utama", departmentId: null, subDepartmentId: null, branchId: null, positionId: posData[0].id, joinDate: "1995-01-01", status: "aktif", employeeType: "tetap", email: "doni@pdam-rinjani.id", birthPlace: "Mataram" },
    
    // KABID (Pusat - Keuangan) - index 1
    { nip: "PDAM-KBD", fullName: "Dra. Siti Rahayu", gender: "Perempuan", officeType: "pusat", structuralPosition: "kabid", departmentId: deptData[1].id, subDepartmentId: null, branchId: null, positionId: posData[1].id, joinDate: "2000-01-01", status: "aktif", employeeType: "tetap", email: "siti@pdam-rinjani.id", birthPlace: "Praya" },
    
    // KASUBBID (Pusat - Keuangan - Akuntansi) - index 2
    { nip: "PDAM-KSB", fullName: "Bambang Purnomo", gender: "Laki-laki", officeType: "pusat", structuralPosition: "kasubbid", departmentId: deptData[1].id, subDepartmentId: subDeptData[0].id, branchId: null, positionId: posData[3].id, joinDate: "2010-01-01", status: "aktif", employeeType: "tetap", email: "bambang@pdam-rinjani.id", birthPlace: "Lombok" },
    
    // STAFF (Pusat - Keuangan - Kas) - index 3
    { nip: "PDAM-STF", fullName: "Dewi Anggraini", gender: "Perempuan", officeType: "pusat", structuralPosition: "staff", departmentId: deptData[1].id, subDepartmentId: subDeptData[1].id, branchId: null, positionId: posData[4].id, joinDate: "2018-01-01", status: "aktif", employeeType: "tetap", birthPlace: "Mataram" },

    // KEPALA CABANG (Cabang Praya) - index 4
    { nip: "PDAM-KCB", fullName: "Ir. Ahmad Suryadi", gender: "Laki-laki", officeType: "cabang", structuralPosition: "kepala_cabang", branchId: branchData[0].id, departmentId: null, subDepartmentId: null, positionId: posData[2].id, joinDate: "2005-01-01", status: "aktif", employeeType: "tetap", email: "ahmad@pdam-rinjani.id", birthPlace: "Praya" },

    // KASUBBID (Cabang Praya - Bag. Administrasi) - index 5
    { nip: "PDAM-CKS", fullName: "Rahmat Hidayat", gender: "Laki-laki", officeType: "cabang", structuralPosition: "kasubbid", branchId: branchData[0].id, departmentId: null, subDepartmentId: subDeptData[2].id, positionId: posData[3].id, joinDate: "2012-01-01", status: "aktif", employeeType: "tetap", birthPlace: "Mataram" },

    // STAFF (Cabang Praya - Bag. Teknik) - index 6
    { nip: "PDAM-CST", fullName: "Agus Setiawan", gender: "Laki-laki", officeType: "cabang", structuralPosition: "staff", branchId: branchData[0].id, departmentId: null, subDepartmentId: subDeptData[3].id, positionId: posData[5].id, joinDate: "2020-01-01", status: "aktif", employeeType: "tetap", birthPlace: "Mataram" },
  ]).returning();

  // Fix manager references using real employee IDs
  await db.update(departments).set({ managerId: empData[1].id }).where(eq(departments.id, deptData[1].id));
  await db.update(branches).set({ headId: empData[4].id }).where(eq(branches.id, branchData[0].id));
  await db.update(subDepartments).set({ managerId: empData[2].id }).where(eq(subDepartments.id, subDeptData[0].id));
  await db.update(subDepartments).set({ managerId: empData[5].id }).where(eq(subDepartments.id, subDeptData[2].id));

  // 6. Users creation
  const superAdminHash = await hashPassword("superadmin123");
  const adminHash = await hashPassword("admin123");
  const pegawaiHash = await hashPassword("pegawai123");
  const direkturHash = await hashPassword("direktur123");

  const userValues = [
    { username: "superadmin", password: superAdminHash, role: "superadmin", employeeId: null },
    { username: "admin", password: adminHash, role: "admin", employeeId: null },
    { username: "direktur", password: direkturHash, role: "direktur", employeeId: empData[0].id },
    { username: "siti.rahayu", password: pegawaiHash, role: "pegawai", employeeId: empData[1].id },
    { username: "bambang.purnomo", password: pegawaiHash, role: "pegawai", employeeId: empData[2].id },
    { username: "ahmad.suryadi", password: pegawaiHash, role: "pegawai", employeeId: empData[4].id },
  ];
  await db.insert(users).values(userValues);

  console.log("Structured 12 Branches and Hierarchy seeded successfully");
}
