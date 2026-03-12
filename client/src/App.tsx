import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth";
import AppLayout from "@/components/layout/app-layout";
import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Employees from "@/pages/employees";
import EmployeeDetail from "@/pages/employee-detail";
import AttendancePage from "@/pages/attendance";
import LeavePage from "@/pages/leave";
import PayrollPage from "@/pages/payroll";

import PerformancePage from "@/pages/performance";
import MutationsPage from "@/pages/mutations";
import TrainingsPage from "@/pages/trainings";
import DocumentsPage from "@/pages/documents";
import ReportsPage from "@/pages/reports";
import RankPromotionsPage from "@/pages/rank-promotions";
import SalaryIncreasesPage from "@/pages/salary-increases";
import RetirementPage from "@/pages/retirement";
import MasterDataPage from "@/pages/master-data";
import OrganizationPage from "@/pages/organization";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function AuthenticatedRoutes() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/employees" component={Employees} />
        <Route path="/employees/:id" component={EmployeeDetail} />
        <Route path="/attendance" component={AttendancePage} />
        <Route path="/leave" component={LeavePage} />
        <Route path="/payroll" component={PayrollPage} />

        <Route path="/performance" component={PerformancePage} />
        <Route path="/mutations" component={MutationsPage} />
        <Route path="/trainings" component={TrainingsPage} />
        <Route path="/documents" component={DocumentsPage} />
        <Route path="/reports" component={ReportsPage} />
        <Route path="/rank-promotions" component={RankPromotionsPage} />
        <Route path="/salary-increases" component={SalaryIncreasesPage} />
        <Route path="/retirement" component={RetirementPage} />
        <Route path="/organization" component={OrganizationPage} />
        <Route path="/master-data" component={MasterDataPage} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function AppRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route>
          <Redirect to="/login" />
        </Route>
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/login">
        <Redirect to="/" />
      </Route>
      <Route>
        <AuthenticatedRoutes />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <AppRouter />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
