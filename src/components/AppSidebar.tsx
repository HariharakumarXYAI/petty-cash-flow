import {
  LayoutDashboard,
  FilePlus,
  FileText,
  Wallet,
  BookOpen,
  AlertTriangle,
  ClipboardCheck,
  Settings,
  BarChart3,
  Store,
  ShieldCheck,
  DollarSign,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "New Claim", url: "/claims/new", icon: FilePlus },
  { title: "Claims", url: "/claims", icon: FileText },
  { title: "Advances", url: "/advances", icon: Wallet },
  { title: "Cashbook", url: "/cashbook", icon: BookOpen },
];

const exceptionItems = [
  { title: "Alerts", url: "/alerts", icon: AlertTriangle },
  { title: "Audit Requests", url: "/audit", icon: ClipboardCheck },
];

const adminItems = [
  { title: "Expense Types", url: "/admin/expenses", icon: DollarSign },
  { title: "Stores & Floats", url: "/admin/stores", icon: Store },
  { title: "Rules", url: "/admin/rules", icon: ShieldCheck },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

function NavGroup({ label, items }: { label: string; items: typeof mainItems }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest font-semibold">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end={item.url === "/"}
                  className="text-sidebar-foreground/70 hover:text-sidebar-primary hover:bg-sidebar-accent/50 transition-colors"
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                >
                  <item.icon className="mr-2 h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-sidebar-accent flex items-center justify-center shrink-0">
            <DollarSign className="h-4 w-4 text-sidebar-primary" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-sm font-bold text-sidebar-primary tracking-tight">PettyCash 360</h2>
              <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-wider">Makro Group</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavGroup label="Operations" items={mainItems} />
        <NavGroup label="Exceptions" items={exceptionItems} />
        <NavGroup label="Administration" items={adminItems} />
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed && (
          <div className="text-[10px] text-sidebar-foreground/40 text-center">
            v1.0 · Multi-Country
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
