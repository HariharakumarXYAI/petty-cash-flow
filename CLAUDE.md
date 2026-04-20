# CLAUDE.md — Lovable Prototype (UI Reference Only)

> **MASTER TECHNICAL REFERENCE:** `../CLAUDE.md` (one level up). That file is the single source of truth for all architecture, stack decisions, validation rules, API contract, DB schema, OCR pipeline, and build order.
>
> This directory (`petty-cash-flow/`) is a **frozen UI prototype**. Do NOT add backend logic, new features, or new dependencies here. Do NOT delete this folder — it is the visual specification for the Next.js migration in `petty-cash-app/`.

---

## What this folder is for

When building pages in `petty-cash-app/`, open the matching prototype page in the browser (`bun run dev` from this directory) to use as a pixel-perfect visual spec. Then rewrite the component code from scratch in Next.js — do not copy code directly (see migration guide in `../CLAUDE.md` Section 14).

## Files useful for migration (copy layout/structure, not logic)

| File | What to take |
|---|---|
| `src/components/ui/` | All shadcn/ui primitives — copy directly to `petty-cash-app/components/ui/` |
| `src/lib/roles.ts` | `AppRole`, `NavGroup`, `getNavForRole()` — copy, remove mock users |
| `src/lib/utils.ts` | `cn()` helper |
| `src/contexts/GlobalFilterContext.tsx` | Filter state shape — rewrite data source |
| Page layouts in `src/pages/` | Visual layout and component composition only |

## Provider tree (reference for App layout structure)
```
QueryClientProvider
  TooltipProvider
    BrowserRouter
      AuthProvider           ← replace with NextAuth useSession()
        AppLayout            ← AppSidebar + AppTopBar wrapper
          GlobalFilterProvider
          SidebarProvider
```

## Run the prototype locally (read-only reference)
```bash
bun run dev    # from this directory — opens on localhost:5173
```
