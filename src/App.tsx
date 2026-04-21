import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { AdminLayout } from "@/components/AdminLayout";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import ClaimsList from "./pages/ClaimsList";
import NewClaim from "./pages/NewClaim";
import ClaimDetail from "./pages/ClaimDetail";
import Advances from "./pages/Advances";
import Cashbook from "./pages/Cashbook";
import AlertsPage from "./pages/AlertsPage";
import Investigations from "./pages/Investigations";
import AuditPage from "./pages/AuditPage";
import ExpenseTypes from "./pages/ExpenseTypes";
import StoresPage from "./pages/StoresPage";

import StoreNew from "./pages/StoreNew";
import StoreEdit from "./pages/StoreEdit";
import RulesPage from "./pages/RulesPage";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import AdminAccess from "./pages/AdminAccess";
import NotFound from "./pages/NotFound";
import SetPassword from "./pages/SetPassword";
import EntitiesPage from "./pages/admin/EntitiesPage";
import EntityEditPage from "./pages/admin/EntityEditPage";
import EntityDetailPage from "./pages/admin/EntityDetailPage";
import OcrRulesPage from "./pages/admin/OcrRulesPage";
import AdminRulesPage from "./pages/admin/AdminRulesPage";
import EmployeesPage from "./pages/admin/EmployeesPage";
import EmployeeEditPage from "./pages/admin/EmployeeEditPage";

import RolesPermissionsPage from "./pages/admin/RolesPermissionsPage";
import RoleDetailPage from "./pages/admin/RoleDetailPage";
import RoleNewPage from "./pages/admin/RoleNewPage";
import DocumentsPage from "./pages/admin/DocumentsPage";
import DocumentEditPage from "./pages/admin/DocumentEditPage";
import AdminExpenseTypesPage from "./pages/admin/AdminExpenseTypesPage";
import ExpenseTypeEditPage from "./pages/admin/ExpenseTypeEditPage";
import PolicyPage from "./pages/admin/PolicyPage";
import PendingInvoiceEmailPage from "./pages/admin/PendingInvoiceEmailPage";
import PendingApprovalEmailPage from "./pages/admin/PendingApprovalEmailPage";
import MonthEndReportPage from "./pages/admin/MonthEndReportPage";
import BranchesPage from "./pages/admin/BranchesPage";
import DepartmentsPage from "./pages/admin/DepartmentsPage";
import AdminStoresPage from "./pages/admin/AdminStoresPage";
import BusinessUnitsPage from "./pages/admin/BusinessUnitsPage";

const queryClient = new QueryClient();

function ProtectedLayout() {
  const { isAuthenticated, requiresPasswordReset } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiresPasswordReset) {
    return <Navigate to="/login/set-password" replace />;
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

function LoginGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login/set-password" element={<SetPassword />} />
      <Route path="/login" element={<LoginGuard><Login /></LoginGuard>} />
      <Route path="/" element={<ProtectedLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="claims" element={<ClaimsList />} />
        <Route path="claims/new" element={<NewClaim />} />
        <Route path="claims/:id" element={<ClaimDetail />} />
        <Route path="advances" element={<Advances />} />
        <Route path="cashbook" element={<Cashbook />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="investigations" element={<Investigations />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="masters/expense-types" element={<ExpenseTypes />} />
        <Route path="masters/stores" element={<StoresPage />} />
        <Route path="masters/stores/new" element={<StoreNew />} />
        <Route path="masters/stores/:storeId/edit" element={<StoreEdit />} />
        
        <Route path="masters/rules" element={<RulesPage />} />
        <Route path="reports/spend-trends" element={<Reports />} />
        <Route path="reports/benchmarking" element={<Reports />} />
        <Route path="reports/advance-aging" element={<Reports />} />
        <Route path="reports/audit-findings" element={<Reports />} />
        <Route path="admin" element={<Navigate to="entities" replace />} />
        <Route path="admin/access" element={<AdminAccess />} />
        <Route path="admin/entities" element={<AdminLayout><EntitiesPage /></AdminLayout>} />
        <Route path="admin/entities/:id/edit" element={<AdminLayout><EntityEditPage /></AdminLayout>} />
        <Route path="admin/entities/:entityCode" element={<AdminLayout><EntityDetailPage /></AdminLayout>} />
        <Route path="admin/ocr-rules" element={<AdminLayout><OcrRulesPage /></AdminLayout>} />
        <Route path="admin/rules" element={<AdminLayout><AdminRulesPage /></AdminLayout>} />
        <Route path="admin/business-units" element={<AdminLayout><BusinessUnitsPage /></AdminLayout>} />
        <Route path="admin/branches" element={<AdminLayout><BranchesPage /></AdminLayout>} />
        <Route path="admin/departments" element={<AdminLayout><DepartmentsPage /></AdminLayout>} />
        <Route path="admin/stores" element={<AdminLayout><AdminStoresPage /></AdminLayout>} />
        <Route path="admin/employees" element={<AdminLayout><EmployeesPage /></AdminLayout>} />
        <Route path="admin/employees/:id/edit" element={<AdminLayout><EmployeeEditPage /></AdminLayout>} />
        
        <Route path="admin/roles" element={<AdminLayout><RolesPermissionsPage /></AdminLayout>} />
        <Route path="admin/roles/new" element={<AdminLayout><RoleNewPage /></AdminLayout>} />
        <Route path="admin/roles/:roleId" element={<AdminLayout><RoleDetailPage /></AdminLayout>} />
        <Route path="admin/documents" element={<AdminLayout><DocumentsPage /></AdminLayout>} />
        <Route path="admin/documents/:id/edit" element={<AdminLayout><DocumentEditPage /></AdminLayout>} />
        <Route path="admin/expense-types" element={<AdminLayout><AdminExpenseTypesPage /></AdminLayout>} />
        <Route path="admin/expense-types/:id/edit" element={<AdminLayout><ExpenseTypeEditPage /></AdminLayout>} />
        <Route path="admin/policy" element={<AdminLayout><PolicyPage /></AdminLayout>} />
        <Route path="admin/notifications/invoice-email" element={<AdminLayout><PendingInvoiceEmailPage /></AdminLayout>} />
        <Route path="admin/notifications/approval-email" element={<AdminLayout><PendingApprovalEmailPage /></AdminLayout>} />
        <Route path="admin/notifications/month-end-report" element={<AdminLayout><MonthEndReportPage /></AdminLayout>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
