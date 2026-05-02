import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type DelegationReason =
  | "sick_leave"
  | "annual_leave"
  | "traveling"
  | "no_store_account"
  | "other";

export interface RequesterProfile {
  employeeId: string;
  fullName: string;
  position: string;
  store: string;
  email: string;
  phone: string;
}

interface EmployeeOption {
  id: string;
  name: string;
  store: string;
}

interface RequesterDetailsCardProps {
  requester: RequesterProfile;
  /** Currently selected delegate employee id (null when not delegating). */
  submittedForEmployeeId: string | null;
  delegationReason: DelegationReason | null;
  onDelegationChange: (
    employeeId: string | null,
    reason: DelegationReason | null,
  ) => void;
  /** Set true after a submit attempt to surface inline errors in State C. */
  showErrors?: boolean;
}

const REASON_OPTIONS: { value: DelegationReason; label: string }[] = [
  { value: "sick_leave", label: "Sick leave" },
  { value: "annual_leave", label: "Annual leave" },
  { value: "traveling", label: "Traveling" },
  { value: "no_store_account", label: "No store account" },
  { value: "other", label: "Other" },
];

// Mock employee directory (current store first, then others).
const CURRENT_STORE_EMPLOYEES: EmployeeOption[] = [
  { id: "EMP-10311", name: "Niran Suksai", store: "Makro Rama 4" },
  { id: "EMP-10422", name: "Pim Chaiyo", store: "Makro Rama 4" },
  { id: "EMP-10588", name: "Anan Wong", store: "Makro Rama 4" },
  { id: "EMP-10612", name: "Kanya Srisuk", store: "Makro Rama 4" },
  { id: "EMP-10733", name: "Tanawat Boon", store: "Makro Rama 4" },
];
const OTHER_STORE_EMPLOYEES: EmployeeOption[] = [
  { id: "EMP-20104", name: "Suda Mekhin", store: "Makro Bangkapi" },
  { id: "EMP-20488", name: "Wirat Phong", store: "Makro Ladprao" },
  { id: "EMP-20992", name: "Malee Chanchai", store: "Makro Pattaya" },
];

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

type Mode = "collapsed" | "expanded" | "delegate";

export function RequesterDetailsCard({
  requester,
  submittedForEmployeeId,
  delegationReason,
  onDelegationChange,
  showErrors = false,
}: RequesterDetailsCardProps) {
  // If parent has delegation already populated, start in delegate mode.
  const [mode, setMode] = useState<Mode>(
    submittedForEmployeeId ? "delegate" : "collapsed",
  );
  const [query, setQuery] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [debounced, setDebounced] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Debounce 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Auto focus search when entering delegate mode
  useEffect(() => {
    if (mode === "delegate" && !submittedForEmployeeId) {
      const t = setTimeout(() => searchRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [mode, submittedForEmployeeId]);

  const initials = getInitials(requester.fullName);

  const enterDelegate = () => setMode("delegate");
  const exitToCollapsed = () => {
    onDelegationChange(null, null);
    setQuery("");
    setMode("collapsed");
  };

  // Search results: store-scoped first, then expand if empty.
  const q = debounced.trim().toLowerCase();
  const matches = (e: EmployeeOption) =>
    !q ||
    e.name.toLowerCase().includes(q) ||
    e.id.toLowerCase().includes(q);
  let results: EmployeeOption[] = CURRENT_STORE_EMPLOYEES.filter(matches);
  if (results.length === 0) {
    results = [...CURRENT_STORE_EMPLOYEES, ...OTHER_STORE_EMPLOYEES].filter(
      matches,
    );
  }
  const suggestions = q ? results.slice(0, 8) : results.slice(0, 5);

  const selectedEmployee = submittedForEmployeeId
    ? [...CURRENT_STORE_EMPLOYEES, ...OTHER_STORE_EMPLOYEES].find(
        (e) => e.id === submittedForEmployeeId,
      )
    : null;

  const employeeError =
    showErrors && mode === "delegate" && !submittedForEmployeeId;
  const reasonError =
    showErrors && mode === "delegate" && !delegationReason;

  // ============ STATE C — Delegate ============
  if (mode === "delegate") {
    return (
      <div
        className="bg-card rounded-xl shadow-sm overflow-hidden"
        style={{
          border: "0.5px solid hsl(var(--primary))",
          padding: "16px 20px",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-full flex items-center justify-center bg-primary/10 text-primary shrink-0">
            <ArrowLeftRight className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-sm font-medium text-foreground flex-1 min-w-0">
            Submitting on behalf
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={exitToCollapsed}
          >
            Submit as myself
          </Button>
        </div>

        <div
          className="grid mt-4"
          style={{ gridTemplateColumns: "1fr 1fr", gap: "14px" }}
        >
          <div className="space-y-1.5 relative">
            <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
              On behalf of
            </label>
            {selectedEmployee ? (
              <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-background text-sm">
                <span className="flex-1 truncate">
                  {selectedEmployee.id} — {selectedEmployee.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onDelegationChange(null, delegationReason);
                    setQuery("");
                    setTimeout(() => searchRef.current?.focus(), 0);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Clear selected employee"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <>
                <Input
                  ref={searchRef}
                  className={cn("h-10 text-sm", employeeError && "border-destructive")}
                  placeholder="Search employee by name or ID…"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowSuggest(true);
                  }}
                  onFocus={() => setShowSuggest(true)}
                  onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                />
                {showSuggest && suggestions.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 rounded-md border border-border bg-popover shadow-md max-h-64 overflow-auto">
                    {suggestions.map((e) => (
                      <button
                        type="button"
                        key={e.id}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                        onMouseDown={(ev) => {
                          ev.preventDefault();
                          onDelegationChange(e.id, delegationReason);
                          setQuery("");
                          setShowSuggest(false);
                        }}
                      >
                        <div className="font-medium">{e.name}</div>
                        <div className="text-[12px] text-muted-foreground">
                          {e.id} · {e.store}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {employeeError && (
                  <p className="text-[12px] text-destructive">
                    Select an employee.
                  </p>
                )}
              </>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
              Reason
            </label>
            <Select
              value={delegationReason ?? undefined}
              onValueChange={(v) =>
                onDelegationChange(
                  submittedForEmployeeId,
                  v as DelegationReason,
                )
              }
            >
              <SelectTrigger
                className={cn("h-10 text-sm", reasonError && "border-destructive")}
              >
                <SelectValue placeholder="Select reason…" />
              </SelectTrigger>
              <SelectContent>
                {REASON_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {reasonError && (
              <p className="text-[12px] text-destructive">Select a reason.</p>
            )}
          </div>
        </div>

        <div
          className="mt-3 rounded-lg bg-primary/10 text-primary"
          style={{ padding: "10px 12px" }}
        >
          <p className="text-[12px] leading-snug">
            This claim will be filed under the selected employee. The system
            records that you submitted on their behalf.
          </p>
        </div>
      </div>
    );
  }

  // ============ STATE A / B ============
  return (
    <div
      className="bg-card rounded-xl shadow-sm overflow-hidden"
      style={{
        border: "0.5px solid hsl(var(--border))",
        padding: "16px 20px",
      }}
    >
      <div className="flex items-center gap-3" style={{ minHeight: "44px" }}>
        <div className="h-9 w-9 rounded-full flex items-center justify-center bg-primary/10 text-primary text-sm font-medium shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate">
            {requester.fullName}
          </div>
          <div className="text-[13px] text-muted-foreground truncate">
            {requester.position} · {requester.store}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {mode === "collapsed" ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setMode("expanded")}
              >
                View details
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={enterDelegate}
              >
                Submit on behalf
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setMode("collapsed")}
            >
              Close
            </Button>
          )}
        </div>
      </div>

      <div
        className={cn(
          "grid transition-all duration-200 ease-out",
          mode === "expanded"
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div
            className="mt-3 pt-3"
            style={{ borderTop: "0.5px solid hsl(var(--border))" }}
          >
            <dl className="text-[13px]">
              <div className="flex items-baseline" style={{ gap: "16px", paddingTop: "5px", paddingBottom: "5px" }}>
                <dt className="text-muted-foreground font-normal" style={{ width: "120px", flexShrink: 0 }}>Employee ID</dt>
                <dd className="text-foreground font-normal text-left">{requester.employeeId}</dd>
              </div>
              <div className="flex items-baseline" style={{ gap: "16px", paddingTop: "5px", paddingBottom: "5px" }}>
                <dt className="text-muted-foreground font-normal" style={{ width: "120px", flexShrink: 0 }}>Email</dt>
                <dd className="font-normal text-left">
                  <a href={`mailto:${requester.email}`} className="text-primary hover:underline">
                    {requester.email}
                  </a>
                </dd>
              </div>
              <div className="flex items-baseline" style={{ gap: "16px", paddingTop: "5px", paddingBottom: "5px" }}>
                <dt className="text-muted-foreground font-normal" style={{ width: "120px", flexShrink: 0 }}>Phone</dt>
                <dd className="text-foreground font-normal text-left">{requester.phone}</dd>
              </div>
            </dl>
          </div>

        </div>
      </div>
    </div>
  );
}
