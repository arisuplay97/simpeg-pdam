import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Employee, Department, Branch, SubDepartment } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Download, Users, ChevronDown, ChevronRight, Share2, Printer } from "lucide-react";

type OrgNode = {
  employee: Employee;
  children: OrgNode[];
};

function buildOrgTree(employees: Employee[], rootStructuralPositions: string[], branchIdFilter?: number | null): OrgNode[] {
  let rootEmployees = employees.filter(e => rootStructuralPositions.includes(e.structuralPosition || ''));
  
  if (branchIdFilter) {
    rootEmployees = rootEmployees.filter(e => e.branchId === branchIdFilter);
  }

  const findChildren = (managerId: number): OrgNode[] => {
    // In our system, 'directly report to' logic is implied by structural positioning.
    // Direktur -> Kabid
    // Kabid -> Kasubbid (same department)
    // Kasubbid -> Staff (same subdepartment)
    // Kepala Cabang -> Kasubbid (same branch)

    const manager = employees.find(e => e.id === managerId);
    if (!manager) return [];

    let directReports: Employee[] = [];

    if (manager.structuralPosition?.includes('direktur')) {
      directReports = employees.filter(e => e.structuralPosition === 'kabid');
    } else if (manager.structuralPosition === 'kabid') {
      directReports = employees.filter(e => e.structuralPosition === 'kasubbid' && e.departmentId === manager.departmentId);
    } else if (manager.structuralPosition === 'kepala_cabang') {
      directReports = employees.filter(e => e.structuralPosition === 'kasubbid' && e.branchId === manager.branchId);
    } else if (manager.structuralPosition === 'kasubbid') {
      directReports = employees.filter(e => e.structuralPosition === 'staff' && e.subDepartmentId === manager.subDepartmentId);
    }

    return directReports.map(emp => ({
      employee: emp,
      children: findChildren(emp.id)
    }));
  };

  return rootEmployees.map(emp => ({
    employee: emp,
    children: findChildren(emp.id)
  }));
}

function OrgTreeNode({ node, departments, branches, subDepartments, defaultExpanded = true }: { node: OrgNode, departments: Department[], branches: Branch[], subDepartments: SubDepartment[], defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const emp = node.employee;

  const getLocationName = () => {
    if (emp.officeType === "pusat") return `Pusat - ${departments.find(d => d.id === emp.departmentId)?.name || ''}`;
    return `Cabang - ${branches.find(b => b.id === emp.branchId)?.name || ''}`;
  };

  const getSubDeptName = () => {
    return subDepartments.find(s => s.id === emp.subDepartmentId)?.name || '';
  };

  const hasChildren = node.children.length > 0;

  const bgColor = 
    emp.structuralPosition?.includes('direktur') ? 'bg-red-600 border-red-700 text-white' :
    emp.structuralPosition === 'kepala_cabang' ? 'bg-emerald-600 border-emerald-700 text-white' :
    emp.structuralPosition === 'kabid' ? 'bg-blue-600 border-blue-700 text-white' :
    emp.structuralPosition === 'kasubbid' ? 'bg-yellow-500 border-yellow-600 text-black' :
    'bg-gray-500 border-gray-600 text-white';

  const textColor = emp.structuralPosition === 'kasubbid' ? 'text-black/80' : 'text-white/90';

  return (
    <div className="flex flex-col items-center">
      <div 
        className={`relative z-10 flex flex-col items-center justify-center p-3 rounded-xl border-2 shadow-sm min-w-[200px] transition-all hover:scale-105 hover:shadow-md cursor-pointer ${bgColor}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-90">
          {emp.structuralPosition?.replace('_', ' ')}
        </div>
        <div className="font-semibold text-sm text-center mb-1">
          {emp.fullName}
        </div>
        <div className={`text-[10px] text-center ${textColor}`}>
          {getLocationName()}
        </div>
        {getSubDeptName() && (
          <div className={`text-[10px] text-center mt-0.5 ${textColor}`}>
            {getSubDeptName()}
          </div>
        )}
        
        {hasChildren && (
          <button 
            className="absolute -bottom-3 w-6 h-6 bg-background rounded-full border-2 border-border flex items-center justify-center text-foreground hover:bg-muted shadow-sm z-20"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="flex flex-col items-center mt-2 relative">
          <div className="w-px h-6 bg-border"></div>
          
          <div className="flex gap-6 relative">
            {node.children.length > 1 && (
              <div className="absolute top-0 left-0 right-0 h-px bg-border" 
                   style={{ left: '50%', right: '50%', width: `calc(100% - ${100 / node.children.length}%)`, transform: 'translateX(-50%)' }}>
              </div>
            )}
            
            {node.children.map((child, idx) => (
              <div key={child.employee.id} className="flex flex-col items-center relative pt-4">
                {node.children.length > 1 && <div className="absolute top-0 w-px h-4 bg-border"></div>}
                <OrgTreeNode node={child} departments={departments} branches={branches} subDepartments={subDepartments} defaultExpanded={defaultExpanded} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrganizationPage() {
  const [viewMode, setViewMode] = useState("pusat");
  const [selectedBranch, setSelectedBranch] = useState("all");

  const { data: employees = [], isLoading: loadingEmp } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });
  const { data: departments = [], isLoading: loadingDept } = useQuery<Department[]>({ queryKey: ["/api/departments"] });
  const { data: branches = [], isLoading: loadingBranch } = useQuery<Branch[]>({ queryKey: ["/api/branches"] });
  const { data: subDepartments = [], isLoading: loadingSub } = useQuery<SubDepartment[]>({ queryKey: ["/api/sub-departments"] });

  const isLoading = loadingEmp || loadingDept || loadingBranch || loadingSub;

  const orgTree = useMemo(() => {
    if (viewMode === "pusat") {
      return buildOrgTree(employees, ['direktur_utama', 'direktur_umum', 'direktur_operasional']);
    } else {
      const branchId = selectedBranch === "all" ? null : parseInt(selectedBranch);
      return buildOrgTree(employees, ['kepala_cabang'], branchId);
    }
  }, [employees, viewMode, selectedBranch]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[600px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Struktur Organisasi</h1>
          <p className="text-sm text-muted-foreground mt-1">Bagan hierarki jabatan Kantor Pusat dan Cabang</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Cetak PDF
          </Button>
        </div>
      </div>

      <Card className="print:border-none print:shadow-none">
        <CardHeader className="border-b print:hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              <Select value={viewMode} onValueChange={v => { setViewMode(v); setSelectedBranch("all"); }}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Pilih Tampilan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pusat">Kantor Pusat (Direksi)</SelectItem>
                  <SelectItem value="cabang">Kantor Cabang</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {viewMode === "cabang" && (
              <div className="w-full sm:w-auto">
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="w-full sm:w-[250px]">
                    <SelectValue placeholder="Pilih Cabang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Cabang (Bersamaan)</SelectItem>
                    {branches.map(b => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-10 overflow-auto min-h-[600px]">
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-16 py-8">
            {orgTree.length > 0 ? (
              orgTree.map((node, idx) => (
                <OrgTreeNode 
                  key={idx} 
                  node={node} 
                  departments={departments} 
                  branches={branches} 
                  subDepartments={subDepartments} 
                  defaultExpanded={true}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground py-20">
                <Users className="w-12 h-12 mb-4 opacity-20" />
                <p>Belum ada data pimpinan di lokasi ini.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
