import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppTopBar } from "@/components/AppTopBar";
import { GlobalFilterProvider } from "@/contexts/GlobalFilterContext";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <GlobalFilterProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <AppTopBar />
            <main className="flex-1 p-4 md:p-6 overflow-auto animate-fade-in">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </GlobalFilterProvider>
  );
}
