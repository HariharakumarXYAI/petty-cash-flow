import { NavLink, useLocation } from "react-router-dom";
import {
  Building2, ScanSearch, Users, ShieldCheck, FileText, DollarSign,
  Scale, Mail, Bell, BarChart3, Settings, GitBranch, Layers, Store, Boxes,
} from "lucide-react";

const adminNavGroups = [
  {
    label: "SYSTEM CONFIGURATION",
    items: [
      { title: "Entities", url: "/admin/entities", icon: Building2 },
      { title: "OCR Validation Rules", url: "/admin/ocr-rules", icon: ScanSearch },
    ],
  },
  {
    label: "COMPANY INFORMATION",
    items: [
      { title: "Business Units", url: "/admin/business-units", icon: Boxes },
      { title: "Branches", url: "/admin/branches", icon: GitBranch },
      { title: "Departments", url: "/admin/departments", icon: Layers },
      { title: "Stores & Floats", url: "/masters/stores", icon: Store },
    ],
  },
  {
    label: "USER SETUP",
    items: [
      { title: "Employee Profiles", url: "/admin/employees", icon: Users },
      { title: "Roles & Permissions", url: "/admin/roles", icon: ShieldCheck },
    ],
  },
  {
    label: "EXPENSE CONFIGURATION",
    items: [
      { title: "Documents", url: "/admin/documents", icon: FileText },
      { title: "Expense Type", url: "/masters/expense-types", icon: DollarSign },
      { title: "Policy Management", url: "/admin/policy", icon: Scale },
    ],
  },
  {
    label: "NOTIFICATION SETUP",
    items: [
      { title: "Pending Invoice Email", url: "/admin/notifications/invoice-email", icon: Mail },
      { title: "Pending Approval Email", url: "/admin/notifications/approval-email", icon: Bell },
      { title: "Month End Report — HR & Finance", url: "/admin/notifications/month-end-report", icon: BarChart3 },
    ],
  },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex h-full -m-4 md:-m-6">
      {/* Secondary sidebar */}
      <aside className="w-[260px] shrink-0 bg-card border-r border-border overflow-y-auto">
        <div className="p-5 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <Settings className="h-5 w-5 text-destructive" />
            <h2 className="text-base font-semibold text-foreground">Admin Settings</h2>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Manage users, workflows, notifications, and integrations
          </p>
        </div>
        <nav className="px-3 pb-4">
          {adminNavGroups.map((group) => (
            <div key={group.label} className="mb-3">
              <div className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest px-2 mb-1">
                {group.label}
              </div>
              {group.items.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <NavLink
                    key={item.url}
                    to={item.url}
                    className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] transition-colors mb-0.5 ${
                      isActive
                        ? "bg-destructive/10 text-destructive font-medium border-l-2 border-destructive -ml-px"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.title}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
      {/* Content area */}
      <div className="flex-1 bg-background p-6 overflow-auto">
        {children}
      </div>
    </div>
  );
}
