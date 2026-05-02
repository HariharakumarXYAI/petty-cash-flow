import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  SUB_EXPENSE_TYPES,
  SUB_EXPENSE_GROUP_ORDER,
  type SubExpenseTypeDef,
  type SubExpenseTypeGroup,
} from "@/lib/sub-expense-types";

const EMOJI_FONT_STACK =
  "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";

// ── Mock "pinned for you" — top 4 sub-types this user used in last 30 days ──
// Empty array = cold-start user; the section will be hidden.
const PINNED_FOR_YOU_IDS: string[] = ["lt-taxi", "lt-meal", "lt-air-dom", "lt-hotel-dom"];

// Highlight matched substring (case-insensitive) using <mark>
function highlight(text: string, q: string) {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-status-alert/15 text-status-alert rounded px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

interface Props {
  countryFilter: string; // accepted for API compat; master list applies to all countries
  onPick: (subTypeId: string) => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

export function SubTypeTilePicker({ onPick, onCancel, showCancel }: Props) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => setDebounced(search.trim()), 100);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [search]);

  const isSearching = debounced.length > 0;

  // Pinned tiles (filtered to ones that exist in the master list)
  const pinned: SubExpenseTypeDef[] = useMemo(() => {
    const out: SubExpenseTypeDef[] = [];
    for (const id of PINNED_FOR_YOU_IDS) {
      const def = SUB_EXPENSE_TYPES.find(s => s.id === id);
      if (def) out.push(def);
      if (out.length >= 4) break;
    }
    return out;
  }, []);

  // Group master list by group (in spec order)
  const grouped = useMemo(() => {
    const map = new Map<SubExpenseTypeGroup, SubExpenseTypeDef[]>();
    for (const g of SUB_EXPENSE_GROUP_ORDER) map.set(g, []);
    for (const s of SUB_EXPENSE_TYPES) map.get(s.group)?.push(s);
    return SUB_EXPENSE_GROUP_ORDER
      .map(g => [g, map.get(g) ?? []] as const)
      .filter(([, items]) => items.length > 0);
  }, []);

  const totalCount = SUB_EXPENSE_TYPES.length;

  // Search results — exact > prefix > substring
  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const q = debounced.toLowerCase();
    type Scored = { item: SubExpenseTypeDef; score: number };
    const scored: Scored[] = [];
    for (const s of SUB_EXPENSE_TYPES) {
      const fields = [s.en, s.th, s.group];
      let best = 0;
      for (const f of fields) {
        const lf = f.toLowerCase();
        if (lf === q) best = Math.max(best, 3);
        else if (lf.startsWith(q)) best = Math.max(best, 2);
        else if (lf.includes(q)) best = Math.max(best, 1);
      }
      if (best > 0) scored.push({ item: s, score: best });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.map(x => x.item);
  }, [debounced, isSearching]);

  // ── Tile (used in default state) ──
  const Tile = ({ s, pinned }: { s: SubExpenseTypeDef; pinned?: boolean }) => {
    return (
      <button
        type="button"
        onClick={() => onPick(s.id)}
        className={cn(
          "group flex flex-col items-start text-left rounded-lg border border-border bg-card",
          "px-3.5 py-3 min-h-[92px] transition-colors",
          "hover:border-primary hover:bg-secondary/40",
          "focus:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30",
          pinned && "border-l-[3px] border-l-primary"
        )}
      >
        <span
          aria-hidden
          className="mb-1.5"
          style={{ fontSize: "28px", lineHeight: 1, fontFamily: EMOJI_FONT_STACK }}
        >
          {s.emoji}
        </span>
        <span className="text-[13px] font-medium text-foreground leading-tight">{s.en}</span>
        <span className="text-[11px] text-muted-foreground leading-tight mt-0.5">{s.th}</span>
      </button>
    );
  };

  // ── Search-result row (denser) ──
  const ResultRow = ({ s, q }: { s: SubExpenseTypeDef; q: string }) => {
    return (
      <button
        type="button"
        onClick={() => onPick(s.id)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left",
          "hover:bg-secondary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 transition-colors"
        )}
      >
        <span
          aria-hidden
          className="shrink-0"
          style={{ fontSize: "22px", lineHeight: 1, fontFamily: EMOJI_FONT_STACK }}
        >
          {s.emoji}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] text-foreground font-medium truncate">{highlight(s.en, q)}</span>
          <span className="block text-[11px] text-muted-foreground truncate">{highlight(s.th, q)}</span>
        </span>
        <span className="shrink-0 text-[10px] uppercase tracking-[0.04em] text-muted-foreground/80 px-2 py-0.5 rounded bg-muted/60">
          {s.group}
        </span>
      </button>
    );
  };

  return (
    <div className="p-4 space-y-4 animate-in fade-in duration-200">
      {/* Header (kept exactly as before) */}
      <div>
        <p className="text-sm font-semibold text-foreground">Choose Sub Expense Type</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Sub-type sets the document checklist for this line.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search expense type..."
          className="h-10 pl-9 pr-9 text-sm"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* SEARCH-RESULTS STATE */}
      {isSearching && (
        <div className="space-y-2">
          {searchResults.length > 0 ? (
            <>
              <p className="text-[11px] text-muted-foreground">
                {searchResults.length} match{searchResults.length === 1 ? "" : "es"}
              </p>
              <div className="space-y-0.5">
                {searchResults.map(s => (
                  <ResultRow key={s.id} s={s} q={debounced} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 space-y-3">
              <p className="text-sm text-muted-foreground">
                No match. Try a different word.
              </p>
              <Button type="button" variant="outline" size="sm" onClick={() => setSearch("")}>
                Clear search
              </Button>
            </div>
          )}
        </div>
      )}

      {/* DEFAULT STATE: Pinned + All expenses (groups always expanded) */}
      {!isSearching && (
        <>
          {pinned.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.04em] text-muted-foreground/80 font-semibold">
                Pinned for you
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {pinned.map(s => <Tile key={`pin-${s.id}`} s={s} pinned />)}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.04em] text-muted-foreground/80 font-semibold">
              All expenses · {totalCount} items
            </p>
            <div className="space-y-4">
              {grouped.map(([group, items]) => (
                <div key={group} className="space-y-2">
                  <p className="text-[13px] font-medium text-muted-foreground">{group}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {items.map(s => <Tile key={s.id} s={s} />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {showCancel && onCancel && (
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      )}
    </div>
  );
}
