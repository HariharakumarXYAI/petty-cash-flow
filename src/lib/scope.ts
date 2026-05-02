// Central scope helper — the single source of truth for "what can this user see?"
// Pages must call getDefaultScope() and applyScope() instead of hardcoding role checks.

import type { AppUser, AppRole } from "@/lib/roles";

export type ScopeKind = "self" | "store" | "region" | "global";

export interface SelfScope {
  type: "self";
  user_id: string;
  store_id: string | null;
}
export interface StoreScope {
  type: "store";
  store_id: string | null;
}
export interface RegionScope {
  type: "region";
  region_id: string | null;
}
export interface GlobalScope {
  type: "global";
  read_only?: boolean;
}

export type Scope = SelfScope | StoreScope | RegionScope | GlobalScope;

/** Default scope applied on page mount for a given user. */
export function getDefaultScope(user: AppUser): Scope {
  switch (user.role) {
    case "store_user":
      return { type: "self", user_id: user.user_id, store_id: user.store_id };
    case "store_manager":
      return { type: "store", store_id: user.store_id };
    case "regional_manager":
      return { type: "region", region_id: user.region_id };
    case "ho_finance":
      return { type: "global" };
    case "internal_audit":
      return { type: "global", read_only: true };
    case "system_admin":
      return { type: "global" };
  }
}

/** Scopes the user is allowed to switch between in a UI toggle. */
export function getAvailableScopes(user: AppUser): ScopeKind[] {
  switch (user.role) {
    case "store_user":
      return ["self"];
    case "store_manager":
      return ["self", "store"];
    case "regional_manager":
      return ["self", "store", "region"];
    case "ho_finance":
      return ["self", "store", "global"];
    case "internal_audit":
      return ["store", "global"];
    case "system_admin":
      return ["global"];
  }
}

/** Minimal record shape that scope-aware lists must satisfy. */
export interface ScopedRecord {
  submitted_by?: string;
  store_id?: string | null;
  region_id?: string | null;
}

/** Filter a record list by scope. */
export function applyScope<T extends ScopedRecord>(
  records: T[],
  scope: Scope,
  user: AppUser,
): T[] {
  switch (scope.type) {
    case "self":
      return records.filter((r) => r.submitted_by === user.user_id);
    case "store":
      return records.filter((r) => r.store_id === user.store_id);
    case "region":
      return records.filter((r) => r.region_id === user.region_id);
    case "global":
      return records;
  }
}

/** Convenience for tests / debugging. */
export function describeScope(scope: Scope): string {
  switch (scope.type) {
    case "self":
      return `self:${scope.user_id}`;
    case "store":
      return `store:${scope.store_id ?? "—"}`;
    case "region":
      return `region:${scope.region_id ?? "—"}`;
    case "global":
      return scope.read_only ? "global (read-only)" : "global";
  }
}

export type { AppRole };
