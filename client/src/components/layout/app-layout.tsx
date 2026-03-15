import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/lib/theme-provider";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import type { Notification } from "@shared/schema";
import {
  LayoutDashboard, Users, CalendarCheck, FileText, DollarSign,
  BarChart3, ArrowLeftRight, GraduationCap, FolderOpen,
  Bell, ChevronLeft, ChevronRight, Sun, Moon, Search, Menu, X,
  ClipboardList, LogOut, Shield, TrendingUp, Clock, Database, Network
} from "lucide-react";
import logoPath from "@assets/Logo_Tirta_1773201248263.png";
import { ScrollArea } from "@/components/ui/scroll-area";

const menuItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/employees", label: "Data Pegawai", icon: Users },
  { path: "/attendance", label: "Absensi", icon: CalendarCheck },
  { path: "/leave", label: "Cuti & Izin", icon: FileText },
  { path: "/payroll", label: "Penggajian", icon: DollarSign },

  { path: "/performance", label: "Kinerja", icon: BarChart3 },
  { path: "/mutations", label: "Mutasi & Promosi", icon: ArrowLeftRight },
  { path: "/rank-promotions", label: "Kenaikan Pangkat", icon: Shield },
  { path: "/salary-increases", label: "Kenaikan Gaji", icon: TrendingUp },
  { path: "/retirement", label: "Pensiun & Kontrak", icon: Clock },
  { path: "/trainings", label: "Pelatihan", icon: GraduationCap },
  { path: "/documents", label: "Dokumen", icon: FolderOpen },
  { path: "/reports", label: "Laporan", icon: ClipboardList },
  { path: "/organization", label: "Struktur Organisasi", icon: Network },
  { path: "/master-data", label: "Master Data", icon: Database },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const displayName = user?.employee?.fullName || user?.username || "User";
  const initials = displayName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
  const roleLabel = user?.role === "superadmin" ? "Super Admin" : user?.role === "admin" ? "Administrator" : user?.role === "direktur" ? "Direktur Utama" : user?.role === "petugas" ? "Petugas" : "Pegawai";

  const isPetugas = user?.role === "petugas";
  const isPegawai = user?.role === "pegawai" || !user?.role;
  const isSuperAdmin = user?.role === "superadmin";
  const isAdminOrDirektur = user?.role === "admin" || user?.role === "direktur";
  
  // Define which paths are allowed for 'petugas'
  const petugasAllowedPaths = [
    "/",
    "/employees",
    "/attendance",
    "/leave",
    "/documents",
    "/organization"
  ];

  // Define which paths are allowed for 'pegawai'
  const pegawaiAllowedPaths = [
    "/",
    "/employees",
    "/attendance",
    "/leave",
    "/payroll",
    "/trainings",
    "/documents",
    "/organization"
  ];

  const visibleMenuItems = menuItems.filter(item => {
    if (isSuperAdmin || isAdminOrDirektur) return true;
    if (isPetugas) return petugasAllowedPaths.includes(item.path);
    if (isPegawai) return pegawaiAllowedPaths.includes(item.path);
    return false;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          data-testid="sidebar-overlay"
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          flex flex-col bg-sidebar border-r border-sidebar-border
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-[68px]" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        data-testid="sidebar"
      >
        <div className={`flex items-center h-16 px-4 border-b border-sidebar-border ${collapsed ? "justify-center" : "gap-3"}`}>
          <img src={logoPath} alt="Logo PDAM" className="w-9 h-9 rounded-lg shrink-0 object-contain" />
          {!collapsed && (
            <h1 className="text-sm font-semibold text-sidebar-foreground whitespace-nowrap leading-tight">PDAM Tirta Ardhia Rinjani</h1>
          )}
        </div>

        <ScrollArea className="flex-1 py-3">
          <nav className="space-y-0.5 px-2">
            {visibleMenuItems.map((item) => {
              const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
              const Icon = item.icon;
              
              let targetPath = item.path;
              if (item.path === "/employees" && isPegawai && user?.employeeId) {
                targetPath = `/employees/${user.employeeId}`;
              }

              return (
                <Link key={item.path} href={targetPath}>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                      transition-all duration-150 relative
                      ${isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }
                      ${collapsed ? "justify-center px-0" : ""}
                    `}
                    data-testid={`nav-${item.path.replace("/", "") || "dashboard"}`}
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </button>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="p-2 border-t border-sidebar-border space-y-1">
          <button
            onClick={logout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors ${collapsed ? "justify-center px-0" : ""}`}
            data-testid="btn-sidebar-logout"
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span>Keluar</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-full items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-sidebar-accent transition-colors"
            data-testid="btn-collapse-sidebar"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Tutup Sidebar</span></>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              data-testid="btn-mobile-menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 w-64 border border-border/50">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari pegawai, menu..."
                className="bg-transparent text-sm outline-none flex-1 placeholder:text-muted-foreground"
                data-testid="input-search"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              data-testid="btn-theme-toggle"
            >
              {theme === "light" ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}
            </button>

            <button className="p-2 rounded-lg hover:bg-muted transition-colors relative" data-testid="btn-notifications">
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2 ml-1 pl-2 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">{initials}</span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium leading-tight">{displayName}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">{roleLabel}</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 border border-destructive/30 transition-colors ml-2"
              data-testid="btn-logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
