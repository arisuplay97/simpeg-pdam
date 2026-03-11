import { db } from "./db";
import {
  departments, positions, employees, attendance, leaveRequests,
  payroll, payrollDeductions, financeTransactions, performanceReviews, mutations,
  trainings, documents, notifications, users,
  rankPromotions, salaryIncreases, approvalLogs
} from "@shared/schema";
import { count, eq } from "drizzle-orm";
import { hashPassword } from "./auth";

async function ensureUsersExist() {
  const adminHash = await hashPassword("admin123");
  const pegawaiHash = await hashPassword("pegawai123");
  const direkturHash = await hashPassword("direktur123");

  const allEmployees = await db.select().from(employees);
  const direkturEmp = allEmployees.find(e => e.fullName.includes("Doni Alga"));
  const ahmadEmp = allEmployees.find(e => e.fullName.includes("Ahmad Suryadi"));
  const sitiEmp = allEmployees.find(e => e.fullName.includes("Siti Rahayu"));
  const bambangEmp = allEmployees.find(e => e.fullName.includes("Bambang Purnomo"));

  const userValues: any[] = [
    { username: "admin", password: adminHash, role: "admin", employeeId: null },
    { username: "direktur", password: direkturHash, role: "direktur", employeeId: direkturEmp?.id || null },
  ];
  if (ahmadEmp) userValues.push({ username: "ahmad.suryadi", password: pegawaiHash, role: "pegawai", employeeId: ahmadEmp.id });
  if (sitiEmp) userValues.push({ username: "siti.rahayu", password: pegawaiHash, role: "pegawai", employeeId: sitiEmp.id });
  if (bambangEmp) userValues.push({ username: "bambang.purnomo", password: pegawaiHash, role: "pegawai", employeeId: bambangEmp.id });

  const doniEmp = allEmployees.find(e => e.nip === "PDAM-001");
  if (doniEmp) userValues.push({ username: "doni.alga", password: pegawaiHash, role: "pegawai", employeeId: doniEmp.id });

  await db.insert(users).values(userValues);
  console.log("User accounts created successfully");
}

export async function seedDatabase() {
  const [existingUsers] = await db.select({ count: count() }).from(users);
  if (existingUsers.count === 0) {
    await ensureUsersExist();
  } else {
    const direkturUser = await db.select().from(users).where(eq(users.username, "direktur"));
    if (direkturUser.length === 0) {
      const direkturHash = await hashPassword("direktur123");
      const allEmps = await db.select().from(employees);
      const direkturEmp = allEmps.find(e => e.fullName.includes("Doni Alga"));
      await db.insert(users).values({ username: "direktur", password: direkturHash, role: "direktur", employeeId: direkturEmp?.id || null });
      console.log("Direktur account created");
    }
  }

  const [existing] = await db.select({ count: count() }).from(employees);
  if (existing.count > 0) return;

  const deptData = await db.insert(departments).values([
    { name: "Bagian Teknik", code: "TEK", headName: "Ir. Ahmad Suryadi", description: "Pengelolaan infrastruktur dan jaringan pipa" },
    { name: "Bagian Keuangan", code: "KEU", headName: "Dra. Siti Rahayu", description: "Manajemen keuangan dan akuntansi" },
    { name: "Bagian SDM & Umum", code: "SDM", headName: "Bambang Purnomo, S.H.", description: "Sumber daya manusia dan administrasi umum" },
    { name: "Bagian Distribusi", code: "DIS", headName: "Ir. Wayan Dharma", description: "Distribusi air ke pelanggan" },
    { name: "Bagian Produksi", code: "PRO", headName: "Dr. Made Suartana", description: "Produksi dan pengolahan air bersih" },
    { name: "Bagian Pelayanan", code: "PEL", headName: "Ni Luh Ketut Sari", description: "Pelayanan pelanggan dan hubungan masyarakat" },
  ]).returning();

  const posData = await db.insert(positions).values([
    { name: "Direktur Utama", level: "Direksi", departmentId: null },
    { name: "Kepala Bagian", level: "Eselon III", departmentId: deptData[0].id },
    { name: "Kepala Seksi", level: "Eselon IV", departmentId: deptData[0].id },
    { name: "Staff Senior", level: "Staff", departmentId: deptData[0].id },
    { name: "Staff", level: "Staff", departmentId: deptData[1].id },
    { name: "Operator", level: "Pelaksana", departmentId: deptData[4].id },
    { name: "Petugas Lapangan", level: "Pelaksana", departmentId: deptData[3].id },
    { name: "Kasir", level: "Pelaksana", departmentId: deptData[1].id },
    { name: "Admin Pelayanan", level: "Staff", departmentId: deptData[5].id },
    { name: "Teknisi", level: "Pelaksana", departmentId: deptData[0].id },
  ]).returning();

  const empData = await db.insert(employees).values([
    { nip: "PDAM-000", fullName: "H. Doni Alga, S.E., M.M.", gender: "Laki-laki", birthPlace: "Mataram", birthDate: "1968-05-20", address: "Jl. Sriwijaya No. 10, Mataram", phone: "081234567000", email: "doni.alga@pdam-rinjani.id", religion: "Islam", education: "S2 Manajemen", departmentId: null, positionId: posData[0].id, status: "aktif", employeeType: "tetap", grade: "IV/b", joinDate: "1995-01-01", npwp: "12.345.678.9-000.000", bpjs: "0001234567000", bankAccount: "1234567000", bankName: "Bank NTB", maritalStatus: "Menikah", lastPromotionDate: "2021-01-01", lastSalaryIncreaseDate: "2023-06-01" },
    { nip: "PDAM-001", fullName: "Ir. Ahmad Suryadi", gender: "Laki-laki", birthPlace: "Mataram", birthDate: "1975-03-15", address: "Jl. Rinjani No. 45, Mataram", phone: "081234567890", email: "ahmad.suryadi@pdam-rinjani.id", religion: "Islam", education: "S1 Teknik Sipil", departmentId: deptData[0].id, positionId: posData[1].id, status: "aktif", employeeType: "tetap", grade: "III/d", joinDate: "2000-01-15", npwp: "12.345.678.9-012.000", bpjs: "0001234567890", bankAccount: "1234567890", bankName: "Bank NTB", maritalStatus: "Menikah", lastPromotionDate: "2020-07-01", lastSalaryIncreaseDate: "2023-01-01" },
    { nip: "PDAM-002", fullName: "Dra. Siti Rahayu", gender: "Perempuan", birthPlace: "Selong", birthDate: "1978-07-22", address: "Jl. Hamzanwadi No. 12, Selong", phone: "081234567891", email: "siti.rahayu@pdam-rinjani.id", religion: "Islam", education: "S1 Akuntansi", departmentId: deptData[1].id, positionId: posData[1].id, status: "aktif", employeeType: "tetap", grade: "III/c", joinDate: "2002-03-01", npwp: "12.345.678.9-013.000", bpjs: "0001234567891", bankAccount: "1234567891", bankName: "Bank NTB", maritalStatus: "Menikah", lastPromotionDate: "2021-03-01", lastSalaryIncreaseDate: "2024-03-01" },
    { nip: "PDAM-003", fullName: "Bambang Purnomo, S.H.", gender: "Laki-laki", birthPlace: "Praya", birthDate: "1980-11-10", address: "Jl. Gajah Mada No. 78, Praya", phone: "081234567892", email: "bambang.purnomo@pdam-rinjani.id", religion: "Islam", education: "S1 Hukum", departmentId: deptData[2].id, positionId: posData[1].id, status: "aktif", employeeType: "tetap", grade: "III/b", joinDate: "2005-06-15", npwp: "12.345.678.9-014.000", bpjs: "0001234567892", bankAccount: "1234567892", bankName: "BRI", maritalStatus: "Menikah", lastPromotionDate: "2022-06-01", lastSalaryIncreaseDate: "2024-06-01" },
    { nip: "PDAM-004", fullName: "Ir. Wayan Dharma", gender: "Laki-laki", birthPlace: "Ampenan", birthDate: "1977-05-03", address: "Jl. Langko No. 34, Mataram", phone: "081234567893", email: "wayan.dharma@pdam-rinjani.id", religion: "Hindu", education: "S1 Teknik Lingkungan", departmentId: deptData[3].id, positionId: posData[1].id, status: "aktif", employeeType: "tetap", grade: "III/c", joinDate: "2001-08-20", npwp: "12.345.678.9-015.000", bpjs: "0001234567893", bankAccount: "1234567893", bankName: "Bank NTB", maritalStatus: "Menikah", lastPromotionDate: "2021-08-01", lastSalaryIncreaseDate: "2023-08-01" },
    { nip: "PDAM-005", fullName: "Dr. Made Suartana", gender: "Laki-laki", birthPlace: "Gerung", birthDate: "1976-09-18", address: "Jl. Pejanggik No. 56, Mataram", phone: "081234567894", email: "made.suartana@pdam-rinjani.id", religion: "Hindu", education: "S2 Teknik Kimia", departmentId: deptData[4].id, positionId: posData[1].id, status: "aktif", employeeType: "tetap", grade: "IV/a", joinDate: "1999-02-01", npwp: "12.345.678.9-016.000", bpjs: "0001234567894", bankAccount: "1234567894", bankName: "BNI", maritalStatus: "Menikah", lastPromotionDate: "2020-02-01", lastSalaryIncreaseDate: "2022-02-01" },
    { nip: "PDAM-006", fullName: "Ni Luh Ketut Sari", gender: "Perempuan", birthPlace: "Mataram", birthDate: "1985-12-25", address: "Jl. Cakranegara No. 89, Mataram", phone: "081234567895", email: "ketut.sari@pdam-rinjani.id", religion: "Hindu", education: "S1 Komunikasi", departmentId: deptData[5].id, positionId: posData[1].id, status: "aktif", employeeType: "tetap", grade: "III/a", joinDate: "2010-04-01", npwp: "12.345.678.9-017.000", bpjs: "0001234567895", bankAccount: "1234567895", bankName: "BCA", maritalStatus: "Lajang", lastPromotionDate: "2022-04-01", lastSalaryIncreaseDate: "2024-04-01" },
    { nip: "PDAM-007", fullName: "Agus Setiawan", gender: "Laki-laki", birthPlace: "Bima", birthDate: "1990-06-14", address: "Jl. Sultan Hasanuddin No. 23, Bima", phone: "081234567896", email: "agus.setiawan@pdam-rinjani.id", religion: "Islam", education: "D3 Teknik Mesin", departmentId: deptData[0].id, positionId: posData[9].id, status: "aktif", employeeType: "tetap", grade: "II/c", joinDate: "2015-01-10", npwp: "12.345.678.9-018.000", bpjs: "0001234567896", bankAccount: "1234567896", bankName: "Bank NTB", maritalStatus: "Menikah", lastPromotionDate: "2021-01-10", lastSalaryIncreaseDate: "2023-01-10" },
    { nip: "PDAM-008", fullName: "Lalu Muh. Irfan", gender: "Laki-laki", birthPlace: "Lombok Tengah", birthDate: "1992-02-28", address: "Jl. Airlangga No. 67, Praya", phone: "081234567897", email: "lalu.irfan@pdam-rinjani.id", religion: "Islam", education: "S1 Teknik Elektro", departmentId: deptData[3].id, positionId: posData[6].id, status: "aktif", employeeType: "tetap", grade: "II/b", joinDate: "2018-07-01", bpjs: "0001234567897", bankAccount: "1234567897", bankName: "BRI", maritalStatus: "Menikah", lastPromotionDate: "2022-07-01", lastSalaryIncreaseDate: "2024-07-01" },
    { nip: "PDAM-009", fullName: "Baiq Nurul Hidayah", gender: "Perempuan", birthPlace: "Selong", birthDate: "1995-04-10", address: "Jl. TGH Zainuddin No. 12, Selong", phone: "081234567898", email: "nurul.hidayah@pdam-rinjani.id", religion: "Islam", education: "S1 Akuntansi", departmentId: deptData[1].id, positionId: posData[4].id, status: "aktif", employeeType: "kontrak", grade: "II/a", joinDate: "2022-01-15", bpjs: "0001234567898", bankAccount: "1234567898", bankName: "Bank NTB", maritalStatus: "Lajang", lastPromotionDate: null, lastSalaryIncreaseDate: "2024-01-15" },
    { nip: "PDAM-010", fullName: "I Gede Oka Wirawan", gender: "Laki-laki", birthPlace: "Mataram", birthDate: "1988-08-17", address: "Jl. Majapahit No. 90, Mataram", phone: "081234567899", email: "oka.wirawan@pdam-rinjani.id", religion: "Hindu", education: "SMK Teknik", departmentId: deptData[4].id, positionId: posData[5].id, status: "aktif", employeeType: "tetap", grade: "II/a", joinDate: "2012-03-15", bpjs: "0001234567899", bankAccount: "1234567899", bankName: "BPD NTB", maritalStatus: "Menikah", lastPromotionDate: "2020-03-15", lastSalaryIncreaseDate: "2022-03-15" },
    { nip: "PDAM-011", fullName: "Dewi Anggraini", gender: "Perempuan", birthPlace: "Dompu", birthDate: "1993-01-05", address: "Jl. Soekarno Hatta No. 45, Dompu", phone: "081234567800", email: "dewi.anggraini@pdam-rinjani.id", religion: "Islam", education: "S1 Manajemen", departmentId: deptData[5].id, positionId: posData[8].id, status: "aktif", employeeType: "kontrak", grade: "II/a", joinDate: "2023-02-01", bpjs: "0001234567800", bankAccount: "1234567800", bankName: "BRI", maritalStatus: "Lajang", lastPromotionDate: null, lastSalaryIncreaseDate: null },
    { nip: "PDAM-012", fullName: "Muh. Rizki Pratama", gender: "Laki-laki", birthPlace: "Sumbawa", birthDate: "1991-10-30", address: "Jl. Garuda No. 11, Sumbawa Besar", phone: "081234567801", email: "rizki.pratama@pdam-rinjani.id", religion: "Islam", education: "D3 Akuntansi", departmentId: deptData[1].id, positionId: posData[7].id, status: "aktif", employeeType: "tetap", grade: "II/b", joinDate: "2016-09-01", bpjs: "0001234567801", bankAccount: "1234567801", bankName: "BNI", maritalStatus: "Menikah", lastPromotionDate: "2020-09-01", lastSalaryIncreaseDate: "2022-09-01" },
    { nip: "PDAM-013", fullName: "Hj. Fatimah Azzahra", gender: "Perempuan", birthPlace: "Mataram", birthDate: "1970-03-08", address: "Jl. Udayana No. 33, Mataram", phone: "081234567802", email: "fatimah.az@pdam-rinjani.id", religion: "Islam", education: "S1 Administrasi", departmentId: deptData[2].id, positionId: posData[3].id, status: "aktif", employeeType: "tetap", grade: "III/d", joinDate: "1995-07-01", bpjs: "0001234567802", bankAccount: "1234567802", bankName: "Bank NTB", maritalStatus: "Menikah", lastPromotionDate: "2019-07-01", lastSalaryIncreaseDate: "2021-07-01" },
    { nip: "PDAM-014", fullName: "Saprudin", gender: "Laki-laki", birthPlace: "Lombok Timur", birthDate: "1987-07-20", address: "Jl. Diponegoro No. 55, Aikmel", phone: "081234567803", email: "saprudin@pdam-rinjani.id", religion: "Islam", education: "SMA", departmentId: deptData[3].id, positionId: posData[6].id, status: "aktif", employeeType: "tetap", grade: "I/d", joinDate: "2014-05-01", bpjs: "0001234567803", bankAccount: "1234567803", bankName: "BRI", maritalStatus: "Menikah", lastPromotionDate: "2020-05-01", lastSalaryIncreaseDate: "2022-05-01" },
    { nip: "PDAM-015", fullName: "Rahmat Hidayatullah", gender: "Laki-laki", birthPlace: "Mataram", birthDate: "1997-11-11", address: "Jl. Brawijaya No. 22, Mataram", phone: "081234567804", email: "rahmat.h@pdam-rinjani.id", religion: "Islam", education: "S1 Teknik Informatika", departmentId: deptData[0].id, positionId: posData[3].id, status: "aktif", employeeType: "kontrak", grade: "II/a", joinDate: "2024-01-15", bpjs: "0001234567804", bankAccount: "1234567804", bankName: "Bank NTB", maritalStatus: "Lajang", lastPromotionDate: null, lastSalaryIncreaseDate: null },
  ]).returning();

  const today = new Date();
  const attendanceRecords = [];
  for (let d = 0; d < 30; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    const dateStr = date.toISOString().split('T')[0];

    for (const emp of empData.slice(1)) {
      const rand = Math.random();
      let status = "hadir";
      let lateMin = 0;
      let checkIn = "07:30";
      let checkOut = "16:00";

      if (rand < 0.05) { status = "sakit"; checkIn = null as any; checkOut = null as any; }
      else if (rand < 0.08) { status = "izin"; checkIn = null as any; checkOut = null as any; }
      else if (rand < 0.10) { status = "cuti"; checkIn = null as any; checkOut = null as any; }
      else if (rand < 0.12) { status = "alpha"; checkIn = null as any; checkOut = null as any; }
      else {
        const h = 7 + Math.floor(Math.random() * 2);
        const m = Math.floor(Math.random() * 60);
        checkIn = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
        if (h > 7 || (h === 7 && m > 30)) { lateMin = (h - 7) * 60 + m - 30; if (lateMin < 0) lateMin = 0; }
        const hOut = 15 + Math.floor(Math.random() * 3);
        const mOut = Math.floor(Math.random() * 60);
        checkOut = `${String(hOut).padStart(2,'0')}:${String(mOut).padStart(2,'0')}`;
      }

      attendanceRecords.push({
        employeeId: emp.id,
        date: dateStr,
        checkIn: status === "hadir" ? checkIn : null,
        checkOut: status === "hadir" ? checkOut : null,
        status,
        lateMinutes: lateMin,
        overtimeHours: Math.random() < 0.1 ? String((Math.random() * 3).toFixed(1)) : "0",
      });
    }
  }

  for (let i = 0; i < attendanceRecords.length; i += 100) {
    await db.insert(attendance).values(attendanceRecords.slice(i, i + 100));
  }

  await db.insert(leaveRequests).values([
    { employeeId: empData[1].id, type: "Cuti Tahunan", startDate: "2026-03-15", endDate: "2026-03-19", days: 5, reason: "Liburan keluarga", status: "approved", approvedBy: "Direktur" },
    { employeeId: empData[6].id, type: "Cuti Sakit", startDate: "2026-03-05", endDate: "2026-03-07", days: 3, reason: "Demam berdarah", status: "approved", approvedBy: "Ka. Bag SDM" },
    { employeeId: empData[9].id, type: "Izin Pribadi", startDate: "2026-03-12", endDate: "2026-03-12", days: 1, reason: "Urusan keluarga", status: "pending" },
    { employeeId: empData[11].id, type: "Cuti Tahunan", startDate: "2026-04-01", endDate: "2026-04-05", days: 5, reason: "Mudik Lebaran", status: "pending" },
    { employeeId: empData[4].id, type: "Dinas Luar", startDate: "2026-03-20", endDate: "2026-03-22", days: 3, reason: "Survei jaringan pipa di Lombok Timur", status: "approved", approvedBy: "Direktur" },
    { employeeId: empData[13].id, type: "Cuti Tahunan", startDate: "2026-03-25", endDate: "2026-03-28", days: 4, reason: "Pernikahan anak", status: "approved", approvedBy: "Ka. Bag SDM" },
  ]);

  const currentPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const payrollRecords = empData.slice(1).map(emp => {
    const basic = 4500000 + Math.floor(Math.random() * 5000000);
    const posAllow = Math.floor(basic * 0.25);
    const famAllow = Math.floor(basic * 0.1);
    const transAllow = 500000;
    const mealAllow = 300000;
    const ot = Math.floor(Math.random() * 800000);
    const inc = Math.floor(Math.random() * 500000);
    const totalEarn = basic + posAllow + famAllow + transAllow + mealAllow + ot + inc;
    const bpjsKes = Math.floor(basic * 0.01);
    const bpjsTK = Math.floor(basic * 0.05);
    const pph21 = Math.floor(totalEarn * 0.05);
    const pension = Math.floor(basic * 0.01);
    const loan = emp.id % 5 === 0 ? 500000 : 0;
    const koperasi = emp.id % 3 === 0 ? 200000 : 0;
    const totalDed = bpjsKes + bpjsTK + pph21 + pension + loan + koperasi;
    return {
      employeeId: emp.id,
      period: currentPeriod,
      basicSalary: String(basic),
      positionAllowance: String(posAllow),
      familyAllowance: String(famAllow),
      transportAllowance: String(transAllow),
      mealAllowance: String(mealAllow),
      overtime: String(ot),
      incentive: String(inc),
      bpjsKesehatanDeduction: String(bpjsKes),
      bpjsKetenagakerjaanDeduction: String(bpjsTK),
      pph21Deduction: String(pph21),
      pensionDeduction: String(pension),
      loanDeduction: String(loan),
      cooperativeDeduction: String(koperasi),
      disciplineDeduction: "0",
      totalEarnings: String(totalEarn),
      totalDeductions: String(totalDed),
      netSalary: String(totalEarn - totalDed),
      status: "final",
    };
  });
  const payrollData = await db.insert(payroll).values(payrollRecords).returning();

  const deductionRecords: any[] = [];
  payrollData.forEach(pr => {
    if (Number(pr.bpjsKesehatanDeduction) > 0) deductionRecords.push({ payrollId: pr.id, employeeId: pr.employeeId, period: pr.period, type: "bpjs_kesehatan", label: "BPJS Kesehatan (1%)", amount: pr.bpjsKesehatanDeduction, description: "Iuran BPJS Kesehatan 1% dari gaji pokok" });
    if (Number(pr.bpjsKetenagakerjaanDeduction) > 0) deductionRecords.push({ payrollId: pr.id, employeeId: pr.employeeId, period: pr.period, type: "bpjs_ketenagakerjaan", label: "BPJS Ketenagakerjaan (5%)", amount: pr.bpjsKetenagakerjaanDeduction, description: "Iuran BPJS Ketenagakerjaan 5% dari gaji pokok" });
    if (Number(pr.pph21Deduction) > 0) deductionRecords.push({ payrollId: pr.id, employeeId: pr.employeeId, period: pr.period, type: "pph21", label: "PPh 21", amount: pr.pph21Deduction, description: "Pajak penghasilan pasal 21" });
    if (Number(pr.pensionDeduction) > 0) deductionRecords.push({ payrollId: pr.id, employeeId: pr.employeeId, period: pr.period, type: "iuran_pensiun", label: "Iuran Pensiun (1%)", amount: pr.pensionDeduction, description: "Iuran pensiun 1% dari gaji pokok" });
    if (Number(pr.loanDeduction) > 0) deductionRecords.push({ payrollId: pr.id, employeeId: pr.employeeId, period: pr.period, type: "pinjaman", label: "Potongan Pinjaman", amount: pr.loanDeduction, description: "Cicilan pinjaman pegawai" });
    if (Number(pr.cooperativeDeduction) > 0) deductionRecords.push({ payrollId: pr.id, employeeId: pr.employeeId, period: pr.period, type: "koperasi", label: "Potongan Koperasi", amount: pr.cooperativeDeduction, description: "Iuran wajib koperasi pegawai" });
  });
  if (deductionRecords.length > 0) await db.insert(payrollDeductions).values(deductionRecords);

  await db.insert(financeTransactions).values([
    { type: "masuk", category: "Pendapatan Air", amount: "450000000", description: "Pendapatan rekening air bulan Februari", date: "2026-02-28", status: "approved", reference: "INV-2026-02" },
    { type: "masuk", category: "Sambungan Baru", amount: "35000000", description: "Biaya sambungan baru 70 pelanggan", date: "2026-03-01", status: "approved", reference: "SB-2026-03" },
    { type: "keluar", category: "Gaji Pegawai", amount: "125000000", description: "Pembayaran gaji bulan Maret 2026", date: "2026-03-05", status: "approved", reference: "PAY-2026-03" },
    { type: "keluar", category: "Bahan Kimia", amount: "28000000", description: "Pembelian PAC dan Kaporit", date: "2026-03-03", status: "approved", reference: "PO-2026-001" },
    { type: "keluar", category: "Listrik", amount: "42000000", description: "Pembayaran listrik pompa dan kantor", date: "2026-03-08", status: "pending", reference: "UTL-2026-03" },
    { type: "keluar", category: "Pemeliharaan", amount: "15000000", description: "Perbaikan pipa distribusi Jl. Rinjani", date: "2026-03-06", status: "approved", reference: "MNT-2026-005" },
    { type: "keluar", category: "ATK & Operasional", amount: "3500000", description: "Pengadaan ATK kantor pusat", date: "2026-03-02", status: "approved", reference: "ATK-2026-03" },
    { type: "masuk", category: "Denda Keterlambatan", amount: "8500000", description: "Denda keterlambatan pembayaran pelanggan", date: "2026-03-04", status: "approved", reference: "DND-2026-03" },
  ]);

  await db.insert(performanceReviews).values([
    { employeeId: empData[1].id, period: "2025-Q4", reviewType: "Triwulan", discipline: 90, attendance: 95, productivity: 88, teamwork: 85, initiative: 82, totalScore: 88, grade: "A", reviewerName: "Direktur Utama" },
    { employeeId: empData[2].id, period: "2025-Q4", reviewType: "Triwulan", discipline: 92, attendance: 90, productivity: 85, teamwork: 88, initiative: 80, totalScore: 87, grade: "A", reviewerName: "Direktur Utama" },
    { employeeId: empData[7].id, period: "2025-Q4", reviewType: "Triwulan", discipline: 78, attendance: 82, productivity: 80, teamwork: 75, initiative: 70, totalScore: 77, grade: "B", reviewerName: "Ir. Ahmad Suryadi" },
    { employeeId: empData[8].id, period: "2025-Q4", reviewType: "Triwulan", discipline: 85, attendance: 88, productivity: 82, teamwork: 80, initiative: 78, totalScore: 83, grade: "B+", reviewerName: "Ir. Wayan Dharma" },
    { employeeId: empData[11].id, period: "2025-Q4", reviewType: "Triwulan", discipline: 88, attendance: 90, productivity: 86, teamwork: 90, initiative: 84, totalScore: 88, grade: "A", reviewerName: "Ni Luh Ketut Sari" },
  ]);

  await db.insert(trainings).values([
    { title: "Pelatihan K3 Keselamatan Kerja", description: "Pelatihan keselamatan dan kesehatan kerja untuk petugas lapangan", trainer: "PT. Safety First Indonesia", location: "Aula Kantor PDAM", startDate: "2026-03-20", endDate: "2026-03-21", departmentId: deptData[0].id, maxParticipants: 30, status: "upcoming" },
    { title: "Workshop Manajemen Keuangan BUMD", description: "Workshop pengelolaan keuangan perusahaan daerah", trainer: "BPKP NTB", location: "Hotel Lombok Raya", startDate: "2026-04-10", endDate: "2026-04-12", departmentId: deptData[1].id, maxParticipants: 15, status: "upcoming" },
    { title: "Pelatihan Sistem Informasi GIS", description: "Pelatihan penggunaan GIS untuk pemetaan jaringan distribusi", trainer: "Universitas Mataram", location: "Lab Komputer PDAM", startDate: "2026-02-15", endDate: "2026-02-17", departmentId: deptData[3].id, maxParticipants: 20, status: "completed" },
  ]);

  const rpData = await db.insert(rankPromotions).values([
    { employeeId: empData[5].id, fromGrade: "III/d", toGrade: "IV/a", scheduledDate: "2020-02-01", promotionDate: "2020-02-01", status: "approved", skNumber: "SK-KP/2020/001", approvedBy: "H. Doni Alga, S.E., M.M.", approvedAt: new Date("2020-01-25") },
    { employeeId: empData[1].id, fromGrade: "III/c", toGrade: "III/d", scheduledDate: "2020-07-01", promotionDate: "2020-07-01", status: "approved", skNumber: "SK-KP/2020/002", approvedBy: "H. Doni Alga, S.E., M.M.", approvedAt: new Date("2020-06-25") },
    { employeeId: empData[13].id, fromGrade: "III/d", toGrade: "IV/a", scheduledDate: "2026-07-01", status: "review_hrd" },
    { employeeId: empData[10].id, fromGrade: "II/a", toGrade: "II/b", scheduledDate: "2026-03-15", status: "approval_direktur" },
  ]).returning();

  const siData = await db.insert(salaryIncreases).values([
    { employeeId: empData[1].id, fromSalary: "6500000", toSalary: "7150000", increasePercentage: "10.00", effectiveDate: "2023-01-01", scheduledDate: "2023-01-01", status: "approved", performanceScore: 88, approvedBy: "H. Doni Alga, S.E., M.M.", approvedAt: new Date("2022-12-20") },
    { employeeId: empData[4].id, fromSalary: "6800000", toSalary: "7480000", increasePercentage: "10.00", effectiveDate: "2023-08-01", scheduledDate: "2023-08-01", status: "approved", performanceScore: 85, approvedBy: "H. Doni Alga, S.E., M.M.", approvedAt: new Date("2023-07-25") },
    { employeeId: empData[12].id, fromSalary: "5200000", toSalary: "5720000", increasePercentage: "10.00", effectiveDate: "2026-09-01", scheduledDate: "2026-09-01", status: "pending", performanceScore: 83 },
  ]).returning();

  await db.insert(approvalLogs).values([
    { entityType: "rank_promotion", entityId: rpData[0].id, action: "submit", performedBy: "admin", notes: "Pengajuan kenaikan pangkat otomatis berdasarkan masa kerja" },
    { entityType: "rank_promotion", entityId: rpData[0].id, action: "approve", performedBy: "H. Doni Alga, S.E., M.M.", notes: "Disetujui sesuai ketentuan" },
    { entityType: "rank_promotion", entityId: rpData[1].id, action: "submit", performedBy: "admin", notes: "Pengajuan kenaikan pangkat berdasarkan masa kerja 4 tahun" },
    { entityType: "rank_promotion", entityId: rpData[1].id, action: "approve", performedBy: "H. Doni Alga, S.E., M.M.", notes: "Disetujui" },
    { entityType: "rank_promotion", entityId: rpData[2].id, action: "submit", performedBy: "admin", notes: "Pengajuan kenaikan pangkat Hj. Fatimah Azzahra" },
    { entityType: "rank_promotion", entityId: rpData[2].id, action: "review", performedBy: "Bambang Purnomo, S.H.", notes: "Sedang direview oleh HRD" },
    { entityType: "rank_promotion", entityId: rpData[3].id, action: "submit", performedBy: "admin", notes: "Pengajuan kenaikan pangkat I Gede Oka Wirawan" },
    { entityType: "rank_promotion", entityId: rpData[3].id, action: "review", performedBy: "Bambang Purnomo, S.H.", notes: "Review HRD selesai" },
    { entityType: "rank_promotion", entityId: rpData[3].id, action: "review", performedBy: "Ir. Ahmad Suryadi", notes: "Review Kabag selesai, menunggu approval Direktur" },
    { entityType: "salary_increase", entityId: siData[0].id, action: "submit", performedBy: "admin", notes: "Pengajuan kenaikan gaji berkala" },
    { entityType: "salary_increase", entityId: siData[0].id, action: "approve", performedBy: "H. Doni Alga, S.E., M.M.", notes: "Disetujui berdasarkan kinerja" },
    { entityType: "salary_increase", entityId: siData[1].id, action: "submit", performedBy: "admin", notes: "Pengajuan kenaikan gaji berkala" },
    { entityType: "salary_increase", entityId: siData[1].id, action: "approve", performedBy: "H. Doni Alga, S.E., M.M.", notes: "Disetujui" },
    { entityType: "salary_increase", entityId: siData[2].id, action: "submit", performedBy: "admin", notes: "Pengajuan kenaikan gaji Muh. Rizki Pratama" },
  ]);

  await db.insert(notifications).values([
    { title: "Pengajuan Cuti Baru", message: "Baiq Nurul Hidayah mengajukan izin pribadi pada 12 Maret 2026", type: "leave", link: "/leave" },
    { title: "Payroll Maret Selesai", message: "Slip gaji bulan Maret 2026 telah di-generate", type: "payroll", link: "/payroll" },
    { title: "Kontrak Hampir Berakhir", message: "Kontrak Dewi Anggraini berakhir dalam 30 hari", type: "warning", link: "/employees" },
    { title: "Pelatihan K3", message: "Pelatihan K3 akan dilaksanakan pada 20-21 Maret 2026", type: "training", link: "/trainings" },
    { title: "Evaluasi Kinerja Q4", message: "Periode penilaian kinerja Q4 2025 telah selesai", type: "performance", link: "/performance" },
    { title: "Laporan Absensi Terlambat", message: "3 pegawai terlambat lebih dari 3 kali bulan ini", type: "warning", link: "/attendance" },
    { title: "Kenaikan Pangkat Menunggu Approval", message: "I Gede Oka Wirawan menunggu approval Direktur untuk kenaikan pangkat II/a ke II/b", type: "warning", link: "/rank-promotions" },
    { title: "Kenaikan Pangkat Dalam Review", message: "Hj. Fatimah Azzahra sedang dalam proses review HRD untuk kenaikan pangkat III/d ke IV/a", type: "warning", link: "/rank-promotions" },
    { title: "Kenaikan Gaji Berkala Pending", message: "Pengajuan kenaikan gaji berkala Muh. Rizki Pratama menunggu persetujuan", type: "warning", link: "/salary-increases" },
    { title: "Pegawai Mendekati Masa Kenaikan Pangkat", message: "Dr. Made Suartana dan Ir. Ahmad Suryadi telah melewati 4 tahun sejak kenaikan pangkat terakhir", type: "warning", link: "/rank-promotions" },
    { title: "Pegawai Mendekati Masa Kenaikan Gaji", message: "Beberapa pegawai telah melewati 2 tahun sejak kenaikan gaji terakhir", type: "warning", link: "/salary-increases" },
  ]);

  const adminHash = await hashPassword("admin123");
  const pegawaiHash = await hashPassword("pegawai123");
  const direkturHash = await hashPassword("direktur123");

  await db.insert(users).values([
    { username: "admin", password: adminHash, role: "admin", employeeId: null },
    { username: "direktur", password: direkturHash, role: "direktur", employeeId: empData[0].id },
    { username: "ahmad.suryadi", password: pegawaiHash, role: "pegawai", employeeId: empData[1].id },
    { username: "siti.rahayu", password: pegawaiHash, role: "pegawai", employeeId: empData[2].id },
    { username: "bambang.purnomo", password: pegawaiHash, role: "pegawai", employeeId: empData[3].id },
  ]);

  console.log("Seed data inserted successfully");
}
