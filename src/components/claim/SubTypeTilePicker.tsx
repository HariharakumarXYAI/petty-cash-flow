import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, MoreHorizontal, ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { expenseTypes, type ExpenseType } from "@/lib/mock-data";

// ────── Display data: Thai names + icon + synonyms keyed by sub-type id ──────
// (UI chrome stays in English; these are content/labels for the catalog.)
const SUBTYPE_META: Record<string, { th: string; icon: string; synonyms?: string[] }> = {
  "lt-taxi":      { th: "แท็กซี่ / Grab",         icon: "🚕", synonyms: ["grab", "bolt", "ride"] },
  "lt-train":     { th: "รถไฟ / ระหว่างเมือง",     icon: "🚆", synonyms: ["brt", "mrt", "intercity"] },
  "lt-car":       { th: "รถยนต์ส่วนตัว / EV",      icon: "🚗", synonyms: ["mileage", "ev", "personal car"] },
  "lt-toll":      { th: "ค่าทางด่วน",              icon: "🛣️", synonyms: ["expressway", "easypass"] },
  "lt-airpark":   { th: "จอดรถสนามบิน",            icon: "🅿️", synonyms: ["airport parking"] },
  "lt-otherpark": { th: "จอดรถอื่นๆ",              icon: "🅿️", synonyms: ["parking"] },
  "lt-rental":    { th: "เช่ารถ",                  icon: "🚙", synonyms: ["hertz", "avis", "car hire"] },
  "lt-air-dom":   { th: "ตั๋วเครื่องบินในประเทศ",    icon: "✈️", synonyms: ["flight", "airfare", "domestic"] },
  "lt-hotel-dom": { th: "โรงแรมในประเทศ",          icon: "🏨", synonyms: ["lodging", "stay", "accommodation"] },
  "lt-meal":      { th: "อาหาร / ร้านอาหาร",       icon: "🍽️", synonyms: ["restaurant", "lunch", "dinner"] },
  "lt-perdiem":   { th: "เบี้ยเลี้ยงในประเทศ",       icon: "💵", synonyms: ["per diem", "allowance"] },
  "lt-postage":   { th: "ค่าไปรษณีย์ / พัสดุ",       icon: "📮", synonyms: ["courier", "dhl", "kerry"] },
  "lt-night":     { th: "อาหารกะกลางคืน",          icon: "🌙", synonyms: ["night shift"] },
  "e1":  { th: "เครื่องเขียน",         icon: "✏️", synonyms: ["pen", "paper"] },
  "e2":  { th: "อุปกรณ์ทำความสะอาด",   icon: "🧽", synonyms: ["cleaning", "detergent"] },
  "e3":  { th: "ซ่อมบำรุงเล็กน้อย",     icon: "🔧", synonyms: ["repair", "fix"] },
  "e4":  { th: "ขนส่งภายในพื้นที่",     icon: "🚚", synonyms: ["transport", "delivery"] },
  "e5":  { th: "ของว่างพนักงาน",       icon: "🥤", synonyms: ["snacks", "drinks"] },
  "e6":  { th: "ไปรษณีย์ / พัสดุ",       icon: "📦", synonyms: ["courier", "mail"] },
  "e7":  { th: "พิมพ์เอกสาร",          icon: "🖨️", synonyms: ["print", "copy"] },
  "e8":  { th: "ค่าสาธารณูปโภคย่อย",   icon: "💡", synonyms: ["water", "electric"] },
  "e9":  { th: "บริการรักษาความปลอดภัย", icon: "🛡️", synonyms: ["guard", "security"] },
  "e10": { th: "เลี้ยงรับรองธุรกิจ",     icon: "🍷", synonyms: ["entertainment", "client"] },
};

const DEFAULT_ICON = "📄";

// Mock global usage rank (lower = more popular). Cold-start order.
const GLOBAL_RANK: string[] = [
  "lt-taxi", "lt-meal", "e1", "lt-air-dom", "lt-hotel-dom",
  "lt-perdiem", "lt-toll", "e5", "lt-car", "e7",
  "lt-postage", "e2", "lt-rental", "e6", "lt-night",
  "e4", "lt-airpark", "lt-train", "lt-otherpark", "e3",
  "e9", "e10", "e8",
];
// Mock "pinned for you" — top 4 the current user has used recently
const PINNED_FOR_YOU: string[] = ["lt-taxi", "lt-meal", "lt-air-dom", "lt-hotel-dom"];
// Mock "popular at your store" — next 8
const POPULAR_AT_STORE: string[] = ["e1", "lt-perdiem", "lt-toll", "e5", "lt-car", "e7", "lt-postage", "e2"];

interface Enriched {
  id: string;
  th: string;
  en: string;          // subcategory
  category: string;
  icon: string;
  synonyms: string[];
}

function enrich(e: ExpenseType): Enriched {
  const m = SUBTYPE_META[e.id];
  return {
    id: e.id,
    th: m?.th ?? e.subcategory,
    en: e.subcategory,
    category: e.category,
    icon: m?.icon ?? DEFAULT_ICON,
    synonyms: m?.synonyms ?? [],
  };
}

// Highlight matched substring (case-insensitive)
function highlight(text: string, q: string): React.ReactNode {
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
  countryFilter: string;
  onPick: (subTypeId: string) => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

export function SubTypeTilePicker({ countryFilter, onPick, onCancel, showCancel }: Props) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [view, setView] = useState<"default" | "browse">("default");
  const [openCats, setOpenCats] = useState<Set<string>>(new Set());
  const debounceRef = useRef<number | null>(null);

  // Filter by country
  const allEnriched = useMemo<Enriched[]>(
    () =>
      expenseTypes
        .filter(e => countryFilter === "all" || e.countries.includes(countryFilter as any))
        .map(enrich),
    [countryFilter]
  );
  const byId = useMemo(() => {
    const m = new Map<string, Enriched>();
    allEnriched.forEach(e => m.set(e.id, e));
    return m;
  }, [allEnriched]);

  // Group by category for browse-all
  const byCategory = useMemo(() => {
    const map = new Map<string, Enriched[]>();
    for (const e of allEnriched) {
      if (!map.has(e.category)) map.set(e.category, []);
      map.get(e.category)!.push(e);
    }
    // sort categories by global volume of their best member
    const cats = Array.from(map.entries()).sort((a, b) => {
      const ra = Math.min(...a[1].map(x => GLOBAL_RANK.indexOf(x.id) === -1 ? 999 : GLOBAL_RANK.indexOf(x.id)));
      const rb = Math.min(...b[1].map(x => GLOBAL_RANK.indexOf(x.id) === -1 ? 999 : GLOBAL_RANK.indexOf(x.id)));
      return ra - rb;
    });
    return cats;
  }, [allEnriched]);

  // Default browse-all: expand first category
  useEffect(() => {
    if (view === "browse" && openCats.size === 0 && byCategory.length > 0) {
      setOpenCats(new Set([byCategory[0][0]]));
    }
  }, [view, byCategory, openCats.size]);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => setDebounced(search.trim()), 100);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [search]);

  const isSearching = debounced.length > 0;

  // ── Default-state tile ids ──
  const defaultPinned = useMemo(
    () => PINNED_FOR_YOU.map(id => byId.get(id)).filter(Boolean) as Enriched[],
    [byId]
  );
  const defaultPopular = useMemo(() => {
    const used = new Set(defaultPinned.map(e => e.id));
    const popular = POPULAR_AT_STORE.map(id => byId.get(id)).filter((e): e is Enriched => !!e && !used.has(e.id));
    // Pad from global rank if needed (target 8)
    if (popular.length < 8) {
      for (const id of GLOBAL_RANK) {
        if (popular.length >= 8) break;
        const e = byId.get(id);
        if (e && !used.has(e.id) && !popular.find(p => p.id === e.id)) popular.push(e);
      }
    }
    return popular.slice(0, 8);
  }, [byId, defaultPinned]);

  // ── Search results ──
  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const q = debounced.toLowerCase();
    type Scored = { item: Enriched; score: number };
    const scored: Scored[] = [];
    for (const e of allEnriched) {
      const fields = [e.th, e.en, e.category, ...e.synonyms].map(s => s.toLowerCase());
      let best = -1;
      for (const f of fields) {
        if (f === q) { best = Math.max(best, 3); }
        else if (f.startsWith(q)) { best = Math.max(best, 2); }
        else if (f.includes(q)) { best = Math.max(best, 1); }
      }
      if (best > 0) scored.push({ item: e, score: best });
    }
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const ra = GLOBAL_RANK.indexOf(a.item.id); const rb = GLOBAL_RANK.indexOf(b.item.id);
      return (ra === -1 ? 999 : ra) - (rb === -1 ? 999 : rb);
    });
    return scored.map(s => s.item);
  }, [allEnriched, debounced, isSearching]);

  const totalCount = allEnriched.length;
  const totalCategories = byCategory.length;

  // ── Renderers ──

  const Tile = ({ e, pinned }: { e: Enriched; pinned?: boolean }) => (
    <button
      type="button"
      onClick={() => onPick(e.id)}
      className={cn(
        "group relative flex flex-col items-start text-left rounded-lg border border-border bg-card",
        "px-3.5 py-3 min-h-[92px] transition-colors",
        "hover:border-primary hover:bg-secondary/40",
        "focus:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30",
        pinned && "border-l-[3px] border-l-primary"
      )}
    >
      <span className="text-[22px] leading-none mb-1.5">{e.icon}</span>
      <span className="text-[13px] font-medium text-foreground leading-tight">{e.th}</span>
      <span className="text-[11px] text-muted-foreground leading-tight">{e.en}</span>
      <span className="mt-auto pt-1.5 text-[10px] uppercase tracking-[0.04em] text-muted-foreground/80">
        {e.category}
      </span>
    </button>
  );

  const BrowseAllTile = () => (
    <button
      type="button"
      onClick={() => { setView("browse"); }}
      className={cn(
        "group flex flex-col items-start text-left rounded-lg border-2 border-dashed border-border bg-transparent",
        "px-3.5 py-3 min-h-[92px] transition-colors",
        "hover:border-primary hover:bg-secondary/40",
        "focus:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30"
      )}
    >
      <MoreHorizontal className="h-[22px] w-[22px] text-muted-foreground mb-1.5" />
      <span className="text-[13px] font-medium text-foreground leading-tight">Browse all</span>
      <span className="text-[11px] text-muted-foreground leading-tight">{totalCount}+ items</span>
      <span className="mt-auto pt-1.5 text-[10px] uppercase tracking-[0.04em] text-muted-foreground/80">
        All categories
      </span>
    </button>
  );

  const ResultRow = ({ e, q }: { e: Enriched; q: string }) => (
    <button
      type="button"
      onClick={() => onPick(e.id)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left",
        "hover:bg-secondary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 transition-colors"
      )}
    >
      <span className="text-[22px] leading-none shrink-0">{e.icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] text-foreground font-medium truncate">{highlight(e.th, q)}</span>
        <span className="block text-[11px] text-muted-foreground truncate">{highlight(e.en, q)}</span>
      </span>
      <span className="shrink-0 text-[10px] uppercase tracking-[0.04em] text-muted-foreground/80 px-2 py-0.5 rounded bg-muted/60">
        {e.category}
      </span>
    </button>
  );

  // Toggle category in browse-all
  const toggleCat = (cat: string) => {
    setOpenCats(prev => {
      const n = new Set(prev);
      if (n.has(cat)) n.delete(cat); else n.add(cat);
      return n;
    });
  };

  const SearchBar = (
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
  );

  // ── Main render ──
  return (
    <div className="p-4 space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      {view === "default" ? (
        <div>
          <p className="text-sm font-semibold text-foreground">Choose Sub Expense Type</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Sub-type sets the document checklist for this line.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <Button
            type="button" variant="ghost" size="sm"
            onClick={() => { setView("default"); }}
            className="h-7 px-2 -ml-2 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">All expense types</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {totalCategories} categories · {totalCount} items
            </p>
          </div>
        </div>
      )}

      {SearchBar}

      {/* SEARCH RESULTS STATE */}
      {isSearching && (
        <div className="space-y-2">
          {searchResults.length > 0 ? (
            <>
              <p className="text-[11px] text-muted-foreground">
                {searchResults.length} match{searchResults.length === 1 ? "" : "es"} across{" "}
                {new Set(searchResults.map(r => r.category)).size} categor
                {new Set(searchResults.map(r => r.category)).size === 1 ? "y" : "ies"}
              </p>
              <div className="space-y-0.5">
                {searchResults.slice(0, 20).map(e => (
                  <ResultRow key={e.id} e={e} q={debounced} />
                ))}
              </div>
              {searchResults.length > 20 && (
                <button
                  type="button"
                  className="text-xs text-primary hover:underline px-3"
                >
                  Show all ({searchResults.length})
                </button>
              )}
            </>
          ) : (
            <div className="text-center py-8 space-y-3">
              <p className="text-sm text-muted-foreground">
                No match. Try a different word, or browse all categories.
              </p>
              <Button type="button" variant="outline" size="sm" onClick={() => setSearch("")}>
                Clear search
              </Button>
            </div>
          )}
        </div>
      )}

      {/* DEFAULT STATE TILES */}
      {!isSearching && view === "default" && (
        <>
          {defaultPinned.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.04em] text-muted-foreground/80 font-semibold">
                Pinned for you
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {defaultPinned.map(e => <Tile key={e.id} e={e} pinned />)}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.04em] text-muted-foreground/80 font-semibold">
              Popular at your store
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {defaultPopular.map(e => <Tile key={e.id} e={e} />)}
              <BrowseAllTile />
            </div>
          </div>
        </>
      )}

      {/* BROWSE-ALL STATE */}
      {!isSearching && view === "browse" && (
        <div className="space-y-1.5">
          {byCategory.map(([cat, items]) => {
            const isOpen = openCats.has(cat);
            return (
              <div key={cat} className="rounded-md overflow-hidden border border-border">
                <button
                  type="button"
                  onClick={() => toggleCat(cat)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-left transition-colors",
                    isOpen ? "bg-primary/5" : "bg-muted/40 hover:bg-muted/60"
                  )}
                >
                  {isOpen
                    ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span className="text-xs font-semibold text-foreground flex-1">{cat}</span>
                  <span className="text-[11px] text-muted-foreground">{items.length} items</span>
                </button>
                {isOpen && (
                  <div className="p-1.5 space-y-0.5 bg-card">
                    {items.map(e => <ResultRow key={e.id} e={e} q="" />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCancel && onCancel && (
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      )}
    </div>
  );
}
