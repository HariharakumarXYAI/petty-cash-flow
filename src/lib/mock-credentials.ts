import type { AppRole } from "@/lib/roles";

export interface MockCredential {
  username: string;
  password: string;
  displayName: string;
  role: AppRole;
  status: "active" | "suspended" | "pending";
  isFirstLogin: boolean;
}

export const mockCredentials: MockCredential[] = [
  { username: "EMP001", password: "pass123", displayName: "Somchai Prasert", role: "store_user", status: "active", isFirstLogin: false },
  { username: "EMP002", password: "pass123", displayName: "Somchai Prathumwan", role: "store_manager", status: "active", isFirstLogin: false },
  { username: "EMP003", password: "pass123", displayName: "Napaporn Suksai", role: "store_user", status: "suspended", isFirstLogin: false },
  { username: "EMP004", password: "pass123", displayName: "Wanida Rattana", role: "store_manager", status: "active", isFirstLogin: true },
  { username: "EMP005", password: "pass123", displayName: "Nattaya Kittisak", role: "regional_manager", status: "active", isFirstLogin: false },
  { username: "EMP006", password: "pass123", displayName: "Thanyarat Chaiyaphum", role: "ho_finance", status: "active", isFirstLogin: false },
  { username: "EMP007", password: "pass123", displayName: "David Lertpanya", role: "internal_audit", status: "active", isFirstLogin: false },
  { username: "EMP008", password: "pass123", displayName: "Kanya Supachai", role: "system_admin", status: "active", isFirstLogin: false },
];

export function authenticateUser(username: string, password: string): { success: boolean; credential?: MockCredential; error?: "invalid" | "inactive" | "not_found" } {
  const cred = mockCredentials.find(c => c.username.toLowerCase() === username.toLowerCase());
  if (!cred) return { success: false, error: "not_found" };
  if (cred.password !== password) return { success: false, error: "invalid" };
  if (cred.status === "suspended") return { success: false, error: "inactive" };
  return { success: true, credential: cred };
}

export function markFirstLoginComplete(username: string, newPassword: string) {
  const cred = mockCredentials.find(c => c.username.toLowerCase() === username.toLowerCase());
  if (cred) {
    cred.isFirstLogin = false;
    cred.password = newPassword;
  }
}

export function getRoleHomePage(role: AppRole): string {
  switch (role) {
    case "store_user": return "/claims";
    case "store_manager": return "/dashboard";
    case "regional_manager": return "/dashboard";
    case "ho_finance": return "/dashboard";
    case "internal_audit": return "/audit";
    case "system_admin": return "/admin/entities";
  }
}
