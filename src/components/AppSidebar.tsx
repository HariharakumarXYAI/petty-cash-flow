import {
  LayoutDashboard, FilePlus, FileText, Wallet, BookOpen,
  AlertTriangle, Search as SearchIcon, ClipboardCheck,
  DollarSign, Store, ShieldCheck, BarChart3, TrendingUp,
  Scale, Clock, FileSearch, Home,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const navGroups = [
  {
    label: "",
    items: [
      { title: "Home", url: "/dashboard", icon: Home },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "New Claim", url: "/claims/new", icon: FilePlus },
      { title: "Claims", url: "/claims", icon: FileText },
      { title: "Advances", url: "/advances", icon: Wallet },
      { title: "Cashbook", url: "/cashbook", icon: BookOpen },
    ],
  },
  {
    label: "Control",
    items: [
      { title: "Alerts", url: "/alerts", icon: AlertTriangle },
      { title: "Investigations", url: "/investigations", icon: SearchIcon },
      { title: "Audit", url: "/audit", icon: ClipboardCheck },
    ],
  },
  {
    label: "Master Data",
    items: [
      { title: "Expense Types", url: "/masters/expense-types", icon: DollarSign },
      { title: "Stores & Floats", url: "/masters/stores", icon: Store },
      { title: "Rules", url: "/masters/rules", icon: ShieldCheck },
    ],
  },
  {
    label: "Reports",
    items: [
      { title: "Spend Trends", url: "/reports/spend-trends", icon: TrendingUp },
      { title: "Store Benchmarking", url: "/reports/benchmarking", icon: Scale },
      { title: "Advance Aging", url: "/reports/advance-aging", icon: Clock },
      { title: "Audit Findings", url: "/reports/audit-findings", icon: FileSearch },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4 pb-2">
        <div className="flex items-center gap-2.5">
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

      <SidebarContent className="px-2">
        {navGroups.map((group, gi) => (
          <SidebarGroup key={gi} className={gi === 0 ? "pb-0" : ""}>
            {group.label && !collapsed && (
              <SidebarGroupLabel className="text-[10px] text-sidebar-foreground/40 uppercase tracking-widest font-semibold px-2 mb-0.5">
                {group.label}
              </SidebarGroupLabel>
            )}
            {group.label && collapsed && <div className="border-t border-sidebar-border my-2" />}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title + item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/dashboard"}
                        className="text-sidebar-foreground/60 hover:text-sidebar-primary hover:bg-sidebar-accent/60 transition-colors rounded-md text-[13px]"
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
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed && (
          <div className="text-[10px] text-sidebar-foreground/30 text-center">
            v1.0 · Multi-Country · {new Date().getFullYear()}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
