// Dynamic role & permission catalog (seed data per spec)

export type ActionKey = "view" | "create" | "edit" | "delete";

export interface PermissionNode {
  id: string;            // unique key e.g. "inventory" or "inventory.merge_pallet"
  label: string;
  actions: ActionKey[];  // which action columns apply to this row
  children?: PermissionNode[];
}

export const ALL_ACTIONS: ActionKey[] = ["view", "create", "edit", "delete"];

export const actionMeta: Record<
  ActionKey,
  { label: string; tone: string; check: string; ring: string; text: string }
> = {
  view: {
    label: "View",
    tone: "bg-blue-50 border-blue-200",
    check: "data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white",
    ring: "focus-visible:ring-blue-500",
    text: "text-blue-700",
  },
  create: {
    label: "Create",
    tone: "bg-green-50 border-green-200",
    check: "data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 data-[state=checked]:text-white",
    ring: "focus-visible:ring-green-500",
    text: "text-green-700",
  },
  edit: {
    label: "Edit",
    tone: "bg-amber-50 border-amber-200",
    check: "data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 data-[state=checked]:text-white",
    ring: "focus-visible:ring-amber-500",
    text: "text-amber-700",
  },
  delete: {
    label: "Delete",
    tone: "bg-red-50 border-red-200",
    check: "data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 data-[state=checked]:text-white",
    ring: "focus-visible:ring-red-500",
    text: "text-red-700",
  },
};

export const permissionCatalog: PermissionNode[] = [
  { id: "dashboard", label: "Dashboard", actions: ["view"] },
  {
    id: "inventory",
    label: "Inventory",
    actions: ["view", "create", "edit", "delete"],
    children: [
      { id: "inventory.merge_pallet", label: "Merge Pallet", actions: ["view"] },
      { id: "inventory.stock_lookup", label: "Stock Lookup", actions: ["view"] },
      { id: "inventory.reprint_qr", label: "Reprint QR Code", actions: ["view"] },
      { id: "inventory.bulk_import", label: "Bulk Import", actions: ["view"] },
    ],
  },
  { id: "activity_log", label: "Activity Log", actions: ["view"] },
  { id: "item_master", label: "Item Master", actions: ["view"] },
  {
    id: "store_location",
    label: "Store & Location",
    actions: ["view", "create", "edit", "delete"],
    children: [
      { id: "store_location.edit", label: "Edit Store & Location", actions: ["edit"] },
      { id: "store_location.block", label: "Block/Unblock Location", actions: ["edit"] },
    ],
  },
  {
    id: "user_management",
    label: "User Management",
    actions: ["view", "create", "edit", "delete"],
    children: [
      { id: "user_management.edit_profile", label: "Edit User Profile", actions: ["edit"] },
      { id: "user_management.reset_password", label: "Reset User Password", actions: ["edit"] },
    ],
  },
  { id: "role_management", label: "Role Management", actions: ["view", "create", "edit", "delete"] },
  {
    id: "shelf_sessions",
    label: "Shelf Sessions",
    actions: ["view", "create"],
    children: [
      { id: "shelf_sessions.create_cancel", label: "Create/Cancel Session", actions: ["create"] },
      { id: "shelf_sessions.manage_baskets", label: "Manage Shelf Baskets", actions: ["create"] },
    ],
  },
  {
    id: "shelf_operators",
    label: "Shelf Operators",
    actions: ["view"],
    children: [
      { id: "shelf_operators.aisle_scan", label: "Aisle Scan Access", actions: ["view"] },
      { id: "shelf_operators.stock_pick", label: "Stock Pick Access", actions: ["view"] },
      { id: "shelf_operators.shelf_restock", label: "Shelf Restock Access", actions: ["view"] },
    ],
  },
  {
    id: "claims",
    label: "Claims",
    actions: ["view", "create", "edit"],
    children: [
      { id: "claims.submit", label: "Submit Claims", actions: ["create"] },
      { id: "claims.view_own", label: "View Own Claims", actions: ["view"] },
      { id: "claims.approve", label: "Approve Claims", actions: ["edit"] },
      { id: "claims.view_team", label: "View Team Claims", actions: ["view"] },
      { id: "claims.view_region", label: "View Region Claims", actions: ["view"] },
      { id: "claims.view_all", label: "View All Claims", actions: ["view"] },
      { id: "claims.approve_escalated", label: "Approve Escalated Claims", actions: ["edit"] },
    ],
  },
  {
    id: "advances",
    label: "Advances",
    actions: ["view", "create", "edit"],
    children: [
      { id: "advances.submit", label: "Submit Advances", actions: ["create"] },
      { id: "advances.view_team", label: "View Team Advances", actions: ["view"] },
      { id: "advances.view_region_overdue", label: "View Region Advances Overdue", actions: ["view"] },
      { id: "advances.manage", label: "Manage Advances", actions: ["edit"] },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    actions: ["view"],
    children: [
      { id: "reports.run", label: "Run Reports", actions: ["view"] },
      { id: "reports.run_audit", label: "Run Audit Reports", actions: ["view"] },
    ],
  },
  {
    id: "alerts",
    label: "Alerts",
    actions: ["view", "edit"],
    children: [
      { id: "alerts.receive_escalation", label: "Receive Escalation Alerts", actions: ["view"] },
      { id: "alerts.manage", label: "Manage Alerts", actions: ["edit"] },
    ],
  },
];

// Flatten helpers
export interface FlatPermissionRow {
  node: PermissionNode;
  depth: number;
  parentId: string | null;
}

export function flattenCatalog(nodes: PermissionNode[] = permissionCatalog): FlatPermissionRow[] {
  const out: FlatPermissionRow[] = [];
  const walk = (list: PermissionNode[], depth: number, parentId: string | null) => {
    for (const n of list) {
      out.push({ node: n, depth, parentId });
      if (n.children?.length) walk(n.children, depth + 1, n.id);
    }
  };
  walk(nodes, 0, null);
  return out;
}

// Stores (seed)
export interface StoreOption {
  code: string;
  name: string;
}

export const storeOptions: StoreOption[] = [
  { code: "001", name: "Makro Lardprao" },
  { code: "002", name: "Makro Store 002" },
  { code: "003", name: "Makro Bangkapi" },
  { code: "004", name: "Makro Chaengwattana" },
  { code: "005", name: "Makro Samut Prakan" },
  { code: "006", name: "Lotus's Rama 4" },
  { code: "007", name: "Lotus's Bangna" },
  { code: "008", name: "Lotus's Pinklao" },
  { code: "009", name: "Lotus's Rangsit" },
];

// Permissions storage: { [permissionId]: { view?: bool, create?: bool, edit?: bool, delete?: bool } }
export type PermissionGrants = Record<string, Partial<Record<ActionKey, boolean>>>;

export type DataScope = "own_store_only" | "own_store" | "assigned_region" | "all_stores";

export const dataScopeOptions: { value: DataScope; label: string; description: string }[] = [
  { value: "own_store_only", label: "Own store only", description: "Restricted to the user's own store" },
  { value: "own_store", label: "Own store", description: "User's store and team data" },
  { value: "assigned_region", label: "Assigned region", description: "All stores in the user's assigned region" },
  { value: "all_stores", label: "All stores", description: "Enterprise-wide access" },
];

export interface DynamicRole {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;       // protected (cannot delete)
  grants: PermissionGrants;
  storeCodes: string[];
  dataScope: DataScope;
  createdAt: string;
  // New module-based permissions (Django-style add/change/delete/view per module).
  // Optional for back-compat with existing seed/storage.
  modulePermissions?: Record<string, Partial<Record<"add" | "change" | "delete" | "view", boolean>>>;
}

// Helpers to build grants
export function emptyGrants(): PermissionGrants {
  return {};
}

export function fullGrants(): PermissionGrants {
  const g: PermissionGrants = {};
  for (const row of flattenCatalog()) {
    g[row.node.id] = {};
    for (const a of row.node.actions) g[row.node.id][a] = true;
  }
  return g;
}

export function countGrants(grants: PermissionGrants): number {
  let n = 0;
  for (const k of Object.keys(grants)) {
    for (const a of ALL_ACTIONS) if (grants[k]?.[a]) n++;
  }
  return n;
}

// Default seed roles
export function seedRoles(): DynamicRole[] {
  const now = new Date().toISOString();

  // Store Manager: claims + advances + shelf
  const managerGrants: PermissionGrants = {};
  const managerIds = [
    "dashboard",
    "claims", "claims.view_team", "claims.view_own", "claims.approve", "claims.submit",
    "advances", "advances.view_team", "advances.manage", "advances.submit",
    "shelf_sessions", "shelf_sessions.create_cancel", "shelf_sessions.manage_baskets",
    "shelf_operators", "shelf_operators.aisle_scan", "shelf_operators.stock_pick", "shelf_operators.shelf_restock",
    "alerts", "alerts.receive_escalation", "alerts.manage",
    "reports", "reports.run",
  ];
  const flat = flattenCatalog();
  for (const row of flat) {
    if (managerIds.includes(row.node.id)) {
      managerGrants[row.node.id] = {};
      for (const a of row.node.actions) managerGrants[row.node.id][a] = true;
    }
  }

  // Store User: very limited
  const userGrants: PermissionGrants = {
    dashboard: { view: true },
    claims: { view: true, create: true },
    "claims.submit": { create: true },
    "claims.view_own": { view: true },
    advances: { create: true },
    "advances.submit": { create: true },
  };

  // Build full module permissions for system admin
  const fullModulePerms: DynamicRole["modulePermissions"] = {};
  const _moduleIds = [
    "entities","rules","stores","employee_profiles","roles","documents",
    "expense_type","policy_management","pending_invoice_email",
    "pending_approval_email","month_end_report","claims","advances","petty_cash_fund",
  ];
  for (const id of _moduleIds) {
    fullModulePerms[id] = { add: true, change: true, delete: true, view: true };
  }

  return [
    {
      id: "role_system_admin",
      name: "System Admin",
      description: "Full access to all modules and stores. Protected role.",
      isSystem: true,
      grants: fullGrants(),
      storeCodes: storeOptions.map((s) => s.code),
      dataScope: "all_stores",
      createdAt: now,
      modulePermissions: fullModulePerms,
    },
    {
      id: "role_store_manager",
      name: "Store Manager",
      description: "Manages claims, advances, and shelf operations for assigned stores.",
      isSystem: false,
      grants: managerGrants,
      storeCodes: ["001", "003"],
      dataScope: "own_store",
      createdAt: now,
      modulePermissions: {
        claims: { add: true, change: true, view: true },
        advances: { add: true, change: true, view: true },
        petty_cash_fund: { view: true },
        employee_profiles: { view: true },
        stores: { view: true },
      },
    },
    {
      id: "role_store_user",
      name: "Store User",
      description: "Submits claims and advances for own store.",
      isSystem: false,
      grants: userGrants,
      storeCodes: ["001"],
      dataScope: "own_store_only",
      createdAt: now,
      modulePermissions: {
        claims: { add: true, view: true },
        advances: { add: true, view: true },
      },
    },
  ];
}

// localStorage persistence
const STORAGE_KEY = "pc360.dynamic_roles.v1";

export function loadRoles(): DynamicRole[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = seedRoles();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as DynamicRole[];
  } catch {
    return seedRoles();
  }
}

export function saveRoles(roles: DynamicRole[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
  } catch {
    /* ignore */
  }
}
