import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import ClaimsList from "./pages/ClaimsList";
import NewClaim from "./pages/NewClaim";
import Alerts from "./pages/Alerts";
import ComingSoon from "./pages/ComingSoon";
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
            <Route path="/" element={<Dashboard />} />
            <Route path="/claims" element={<ClaimsList />} />
            <Route path="/claims/new" element={<NewClaim />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/advances" element={<ComingSoon />} />
            <Route path="/cashbook" element={<ComingSoon />} />
            <Route path="/audit" element={<ComingSoon />} />
            <Route path="/admin/expenses" element={<ComingSoon />} />
            <Route path="/admin/stores" element={<ComingSoon />} />
            <Route path="/admin/rules" element={<ComingSoon />} />
            <Route path="/reports" element={<ComingSoon />} />
            <Route path="/settings" element={<ComingSoon />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
