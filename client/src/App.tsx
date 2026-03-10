import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import AppLayout from "@/components/layout/app-layout";
import Dashboard from "@/pages/dashboard";
import Employees from "@/pages/employees";
import EmployeeDetail from "@/pages/employee-detail";
import AttendancePage from "@/pages/attendance";
import LeavePage from "@/pages/leave";
import PayrollPage from "@/pages/payroll";
import FinancePage from "@/pages/finance";
import PerformancePage from "@/pages/performance";
import MutationsPage from "@/pages/mutations";
import TrainingsPage from "@/pages/trainings";
import DocumentsPage from "@/pages/documents";
import ReportsPage from "@/pages/reports";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/employees" component={Employees} />
        <Route path="/employees/:id" component={EmployeeDetail} />
        <Route path="/attendance" component={AttendancePage} />
        <Route path="/leave" component={LeavePage} />
        <Route path="/payroll" component={PayrollPage} />
        <Route path="/finance" component={FinancePage} />
        <Route path="/performance" component={PerformancePage} />
        <Route path="/mutations" component={MutationsPage} />
        <Route path="/trainings" component={TrainingsPage} />
        <Route path="/documents" component={DocumentsPage} />
        <Route path="/reports" component={ReportsPage} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
