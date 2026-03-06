import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
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
import RulesPage from "./pages/RulesPage";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/claims" element={<ClaimsList />} />
            <Route path="/claims/new" element={<NewClaim />} />
            <Route path="/claims/:id" element={<ClaimDetail />} />
            <Route path="/advances" element={<Advances />} />
            <Route path="/cashbook" element={<Cashbook />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/investigations" element={<Investigations />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/masters/expense-types" element={<ExpenseTypes />} />
            <Route path="/masters/stores" element={<StoresPage />} />
            <Route path="/masters/rules" element={<RulesPage />} />
            <Route path="/reports/spend-trends" element={<Reports />} />
            <Route path="/reports/benchmarking" element={<Reports />} />
            <Route path="/reports/advance-aging" element={<Reports />} />
            <Route path="/reports/audit-findings" element={<Reports />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
