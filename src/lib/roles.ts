import {
  LayoutDashboard, FilePlus, FileText, Wallet, BookOpen,
  AlertTriangle, Search as SearchIcon, ClipboardCheck,
  ShieldCheck, TrendingUp, Scale, Clock, FileSearch,
  Home, CheckSquare, BarChart3, Users, Eye, Settings, Store,
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

export type CountryCode = "TH" | "KH" | "MM" | "LA";

export interface AppUser {
  id: string;
  /** Stable scope-service identifier (mirrors `id` for the prototype). */
  user_id: string;
  email: string;
  displayName: string;
  /** Full name used by scope service & route guards. */
  full_name: string;
  initials: string;
  role: AppRole;
  scope: UserScope;
  /** Scope-service fields — used by src/lib/scope.ts. */
  store_id: string | null;
  region_id: string | null;
  country_code: CountryCode | null;
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
    items: [
      { title: "Dashboard", url: "/dashboard", icon: Home, end: true },
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
      { title: "New Claim", url: "/claims/new", icon: FilePlus },
      { title: "My Claims", url: "/claims", icon: FileText },
      { title: "My Advances", url: "/advances", icon: Wallet },
      { title: "Approvals", url: "/approvals", icon: CheckSquare },
    ],
  },
  {
    label: "Control",
    items: [
      { title: "Store Overview", url: "/store-overview", icon: Store },
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
      { title: "Approvals", url: "/approvals", icon: CheckSquare },
    ],
  },
  {
    label: "Control",
    items: [
      { title: "Exceptions", url: "/alerts", icon: AlertTriangle },
      { title: "Store Trends", url: "/reports/benchmarking", icon: TrendingUp },
      { title: "Advances Overview", url: "/advances", icon: Wallet },
    ],
  },
];

/** Human-readable label for a region_id. */
export const regionLabels: Record<string, string> = {
  "r-bkk": "Bangkok Metro",
  "r-east": "Eastern Thailand",
  "r-north": "Northern Thailand",
  "r-kh": "Cambodia",
  "r-mm": "Myanmar",
};

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
    id: "u1", user_id: "u1", email: "thanyarat.c@makro.co.th",
    displayName: "Thanyarat Chaiyaphum", full_name: "Thanyarat Chaiyaphum",
    initials: "TC", role: "ho_finance", scope: { type: "enterprise", id: "all", label: "Enterprise" },
    store_id: null, region_id: null, country_code: null,
    approvalLimit: null, lastLogin: "2026-03-07T08:12:00Z", status: "active",
  },
  {
    id: "u2", user_id: "u2", email: "somchai.p@makro.co.th",
    displayName: "Somchai Prathumwan", full_name: "Somchai Prathumwan",
    initials: "SP", role: "store_manager", scope: { type: "store", id: "s3", label: "Makro Rama 4" },
    store_id: "s3", region_id: "r-bkk", country_code: "TH",
    approvalLimit: 25000, lastLogin: "2026-03-07T07:45:00Z", status: "active",
  },
  {
    id: "u3", user_id: "u3", email: "nattaya.k@makro.co.th",
    displayName: "Nattaya Kittisak", full_name: "Nattaya Kittisak",
    initials: "NK", role: "regional_manager", scope: { type: "region", id: "r-bkk", label: "Bangkok Metro" },
    store_id: null, region_id: "r-bkk", country_code: "TH",
    approvalLimit: 100000, lastLogin: "2026-03-06T16:30:00Z", status: "active",
  },
  {
    id: "u4", user_id: "u4", email: "priya.m@makro.co.th",
    displayName: "Priya Mongkol", full_name: "Priya Mongkol",
    initials: "PM", role: "store_user", scope: { type: "store", id: "s1", label: "Makro Bangkapi" },
    store_id: "s1", region_id: "r-bkk", country_code: "TH",
    approvalLimit: null, lastLogin: "2026-03-07T09:00:00Z", status: "active",
  },
  {
    id: "u5", user_id: "u5", email: "david.l@makro.co.th",
    displayName: "David Lertpanya", full_name: "David Lertpanya",
    initials: "DL", role: "internal_audit", scope: { type: "country", id: "TH", label: "Thailand" },
    store_id: null, region_id: null, country_code: "TH",
    approvalLimit: null, lastLogin: "2026-03-05T14:22:00Z", status: "active",
  },
  {
    id: "u6", user_id: "u6", email: "kanya.s@makro.co.th",
    displayName: "Kanya Supachai", full_name: "Kanya Supachai",
    initials: "KS", role: "system_admin", scope: { type: "enterprise", id: "all", label: "Enterprise" },
    store_id: null, region_id: null, country_code: null,
    approvalLimit: null, lastLogin: "2026-03-07T06:00:00Z", status: "active",
  },
  {
    id: "u7", user_id: "u7", email: "chan.v@makro.kh",
    displayName: "Chan Virak", full_name: "Chan Virak",
    initials: "CV", role: "store_manager", scope: { type: "store", id: "s7", label: "Makro Phnom Penh 1" },
    store_id: "s7", region_id: "r-kh", country_code: "KH",
    approvalLimit: 500, lastLogin: "2026-03-06T11:15:00Z", status: "active",
  },
  {
    id: "u8", user_id: "u8", email: "aung.m@makro.mm",
    displayName: "Aung Myint", full_name: "Aung Myint",
    initials: "AM", role: "store_user", scope: { type: "store", id: "s9", label: "Makro Yangon Central" },
    store_id: "s9", region_id: "r-mm", country_code: "MM",
    approvalLimit: null, lastLogin: "2026-03-04T09:30:00Z", status: "suspended",
  },
  {
    id: "u9", user_id: "u9", email: "narong.t@makro.co.th",
    displayName: "Narong Tanachai", full_name: "Narong Tanachai",
    initials: "NT", role: "ho_finance", scope: { type: "country", id: "TH", label: "Thailand" },
    store_id: null, region_id: null, country_code: "TH",
    approvalLimit: null, lastLogin: "2026-03-07T07:00:00Z", status: "active",
  },
  {
    id: "u10", user_id: "u10", email: "new.hire@makro.co.th",
    displayName: "Pending User", full_name: "Pending User",
    initials: "PU", role: "store_user", scope: { type: "store", id: "s3", label: "Makro Rama 4" },
    store_id: "s3", region_id: "r-bkk", country_code: "TH",
    approvalLimit: null, lastLogin: "", status: "pending",
  },
];
