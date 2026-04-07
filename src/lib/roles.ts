import {
  LayoutDashboard, FilePlus, FileText, Wallet, BookOpen,
  AlertTriangle, Search as SearchIcon, ClipboardCheck,
  DollarSign, ShieldCheck, TrendingUp, Scale, Clock, FileSearch,
  Home, CheckSquare, BarChart3, Users, Eye, Settings,
  type LucideIcon,
} from "lucide-react";

export type AppRole =
  | "store_user"
  | "store_manager"
  | "regional_manager"
  | "ho_finance"
  | "internal_audit"
  | "system_admin";

export type ScopeType = "store" | "region" | "country" | "entity" | "enterprise";

export interface UserScope {
  type: ScopeType;
  id: string;
  label: string;
}

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  initials: string;
  role: AppRole;
  scope: UserScope;
  approvalLimit: number | null; // null = no approval authority
  lastLogin: string;
  status: "active" | "suspended" | "pending";
}

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  end?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const roleLabels: Record<AppRole, string> = {
  store_user: "Store User",
  store_manager: "Store Manager",
  regional_manager: "Regional Manager",
  ho_finance: "Head Office Finance",
  internal_audit: "Internal Audit",
  system_admin: "System Admin",
};

export const roleBadgeColors: Record<AppRole, string> = {
  store_user: "bg-muted text-muted-foreground",
  store_manager: "bg-status-approved/10 text-status-approved border-status-approved/20",
  regional_manager: "bg-status-audit/10 text-status-audit border-status-audit/20",
  ho_finance: "bg-primary/10 text-primary border-primary/20",
  internal_audit: "bg-status-investigation/10 text-status-investigation border-status-investigation/20",
  system_admin: "bg-status-hold/10 text-status-hold border-status-hold/20",
};

export const scopeLabels: Record<ScopeType, string> = {
  store: "Store",
  region: "Region",
  country: "Country",
  entity: "Legal Entity",
  enterprise: "Enterprise",
};

const storeUserNav: NavGroup[] = [
  {
    label: "",
    items: [{ title: "Dashboard", url: "/dashboard", icon: Home, end: true }],
  },
  {
    label: "My Work",
    items: [
      { title: "New Claim", url: "/claims/new", icon: FilePlus },
      { title: "My Claims", url: "/claims", icon: FileText },
      { title: "My Advances", url: "/advances", icon: Wallet },
    ],
  },
];

const storeManagerNav: NavGroup[] = [
  {
    label: "",
    items: [{ title: "Dashboard", url: "/dashboard", icon: Home, end: true }],
  },
  {
    label: "Operations",
    items: [
      { title: "Claims", url: "/claims", icon: FileText },
      { title: "Approvals", url: "/claims", icon: CheckSquare },
      { title: "Advances", url: "/advances", icon: Wallet },
      { title: "Cashbook", url: "/cashbook", icon: BookOpen },
    ],
  },
  {
    label: "Control",
    items: [
      { title: "Audit Requests", url: "/audit", icon: ClipboardCheck },
    ],
  },
];

const regionalManagerNav: NavGroup[] = [
  {
    label: "",
    items: [{ title: "Dashboard", url: "/dashboard", icon: Home, end: true }],
  },
  {
    label: "Operations",
    items: [
      { title: "Regional Claims", url: "/claims", icon: FileText },
      { title: "Approvals", url: "/claims", icon: CheckSquare },
      { title: "Exceptions", url: "/alerts", icon: AlertTriangle },
      { title: "Store Trends", url: "/reports/benchmarking", icon: TrendingUp },
      { title: "Advances", url: "/advances", icon: Wallet },
    ],
  },
];

const hoFinanceNav: NavGroup[] = [
  {
    label: "",
    items: [{ title: "Dashboard", url: "/dashboard", icon: Home, end: true }],
  },
  {
    label: "Operations",
    items: [
      { title: "Claims", url: "/claims", icon: FileText },
      { title: "Alerts", url: "/alerts", icon: AlertTriangle },
      { title: "Investigations", url: "/investigations", icon: SearchIcon },
      { title: "Audit", url: "/audit", icon: ClipboardCheck },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Cashbook Oversight", url: "/cashbook", icon: BookOpen },
      { title: "Advances", url: "/advances", icon: Wallet },
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
  {
    label: "Master Data",
    items: [
      { title: "Rules", url: "/masters/rules", icon: ShieldCheck },
    ],
  },
  {
    label: "Admin",
    items: [
      { title: "Admin Settings", url: "/admin", icon: Settings },
    ],
  },
];

const auditNav: NavGroup[] = [
  {
    label: "",
    items: [{ title: "Audit Dashboard", url: "/dashboard", icon: Home, end: true }],
  },
  {
    label: "Audit",
    items: [
      { title: "Sample Requests", url: "/audit", icon: ClipboardCheck },
      { title: "Findings", url: "/reports/audit-findings", icon: FileSearch },
      { title: "Audit Trail", url: "/audit", icon: Eye },
    ],
  },
];

const sysAdminNav: NavGroup[] = [
  {
    label: "",
    items: [{ title: "Dashboard", url: "/dashboard", icon: Home, end: true }],
  },
  {
    label: "Administration",
    items: [
      { title: "Admin Settings", url: "/admin", icon: Settings },
      { title: "Expense Types", url: "/masters/expense-types", icon: DollarSign },
      { title: "Rules", url: "/masters/rules", icon: ShieldCheck },
    ],
  },
];

export function getNavForRole(role: AppRole): NavGroup[] {
  switch (role) {
    case "store_user": return storeUserNav;
    case "store_manager": return storeManagerNav;
    case "regional_manager": return regionalManagerNav;
    case "ho_finance": return hoFinanceNav;
    case "internal_audit": return auditNav;
    case "system_admin": return sysAdminNav;
  }
}

// Mock users for the admin page
export const mockUsers: AppUser[] = [
  {
    id: "u1", email: "thanyarat.c@makro.co.th", displayName: "Thanyarat Chaiyaphum",
    initials: "TC", role: "ho_finance", scope: { type: "enterprise", id: "all", label: "Enterprise" },
    approvalLimit: null, lastLogin: "2026-03-07T08:12:00Z", status: "active",
  },
  {
    id: "u2", email: "somchai.p@makro.co.th", displayName: "Somchai Prathumwan",
    initials: "SP", role: "store_manager", scope: { type: "store", id: "s1", label: "Makro Rama IV" },
    approvalLimit: 25000, lastLogin: "2026-03-07T07:45:00Z", status: "active",
  },
  {
    id: "u3", email: "nattaya.k@makro.co.th", displayName: "Nattaya Kittisak",
    initials: "NK", role: "regional_manager", scope: { type: "region", id: "r1", label: "Bangkok Metro" },
    approvalLimit: 100000, lastLogin: "2026-03-06T16:30:00Z", status: "active",
  },
  {
    id: "u4", email: "priya.m@makro.co.th", displayName: "Priya Mongkol",
    initials: "PM", role: "store_user", scope: { type: "store", id: "s2", label: "Makro Bangna" },
    approvalLimit: null, lastLogin: "2026-03-07T09:00:00Z", status: "active",
  },
  {
    id: "u5", email: "david.l@makro.co.th", displayName: "David Lertpanya",
    initials: "DL", role: "internal_audit", scope: { type: "country", id: "TH", label: "Thailand" },
    approvalLimit: null, lastLogin: "2026-03-05T14:22:00Z", status: "active",
  },
  {
    id: "u6", email: "kanya.s@makro.co.th", displayName: "Kanya Supachai",
    initials: "KS", role: "system_admin", scope: { type: "enterprise", id: "all", label: "Enterprise" },
    approvalLimit: null, lastLogin: "2026-03-07T06:00:00Z", status: "active",
  },
  {
    id: "u7", email: "chan.v@makro.kh", displayName: "Chan Virak",
    initials: "CV", role: "store_manager", scope: { type: "store", id: "s4", label: "Makro Phnom Penh" },
    approvalLimit: 500, lastLogin: "2026-03-06T11:15:00Z", status: "active",
  },
  {
    id: "u8", email: "aung.m@makro.mm", displayName: "Aung Myint",
    initials: "AM", role: "store_user", scope: { type: "store", id: "s6", label: "Makro Yangon" },
    approvalLimit: null, lastLogin: "2026-03-04T09:30:00Z", status: "suspended",
  },
  {
    id: "u9", email: "narong.t@makro.co.th", displayName: "Narong Tanachai",
    initials: "NT", role: "ho_finance", scope: { type: "country", id: "TH", label: "Thailand" },
    approvalLimit: null, lastLogin: "2026-03-07T07:00:00Z", status: "active",
  },
  {
    id: "u10", email: "new.hire@makro.co.th", displayName: "Pending User",
    initials: "PU", role: "store_user", scope: { type: "store", id: "s1", label: "Makro Rama IV" },
    approvalLimit: null, lastLogin: "", status: "pending",
  },
];
