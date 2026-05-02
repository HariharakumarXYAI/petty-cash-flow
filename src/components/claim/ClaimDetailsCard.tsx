import { useState } from "react";
import { Copy, Check, Zap, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export interface OpenAdvanceOption {
  id: string;
  reference: string;
  remainingLabel: string; // e.g. "2,500 THB remaining"
}

interface ClaimDetailsCardProps {
  claimNumber: string;
  createdAtDisplay: string;
  status?: string;
  purpose: string;
  onPurposeChange: (val: string) => void;

  openAdvances: OpenAdvanceOption[];
  linkedAdvanceId: string | null;
  onLinkAdvance: (id: string | null) => void;
}

function countWords(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

export function ClaimDetailsCard({
  claimNumber,
  createdAtDisplay,
  status = "Draft",
  purpose,
  onPurposeChange,
  openAdvances,
  linkedAdvanceId,
  onLinkAdvance,
}: ClaimDetailsCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pickedAdvanceId, setPickedAdvanceId] = useState<string | null>(
    openAdvances[0]?.id ?? null,
  );

  const words = countWords(purpose);
  const overLimit = words > 250;

  const linkedAdvance = linkedAdvanceId
    ? openAdvances.find((a) => a.id === linkedAdvanceId) ?? null
    : null;

  const copyClaimNumber = async () => {
    if (!claimNumber) return;
    await navigator.clipboard.writeText(claimNumber);
    setCopied(true);
    toast({ title: "Copied" });
    setTimeout(() => setCopied(false), 1500);
  };

  const advanceToShow =
    linkedAdvance ??
    openAdvances.find((a) => a.id === pickedAdvanceId) ??
    openAdvances[0];

  const renderBanner = () => {
    if (openAdvances.length === 0) return null;

    if (linkedAdvance) {
      return (
        <div
          className="rounded-lg flex items-center gap-3"
          style={{
            background: "hsl(var(--status-approved) / 0.10)",
            color: "hsl(var(--status-approved))",
            padding: "12px 14px",
          }}
        >
          <Check className="h-4 w-4 shrink-0" />
          <div className="flex-1 min-w-0 text-[13px] leading-snug text-foreground">
            <span className="font-medium">Linked to {linkedAdvance.reference}</span>
            <span className="text-muted-foreground">
              {" "}· {linkedAdvance.remainingLabel} will offset this claim
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0"
            onClick={() => onLinkAdvance(null)}
          >
            Unlink
          </Button>
        </div>
      );
    }

    return (
      <div
        className="rounded-lg flex items-center gap-3"
        style={{
          background: "hsl(var(--primary) / 0.08)",
          padding: "12px 14px",
        }}
      >
        <Zap className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
          <div className="text-[13px] text-foreground">
            You have {openAdvances.length} open advance
            {openAdvances.length > 1 ? "s" : ""}
          </div>
          {openAdvances.length > 1 ? (
            <Select
              value={pickedAdvanceId ?? undefined}
              onValueChange={(v) => setPickedAdvanceId(v)}
            >
              <SelectTrigger className="h-8 text-[13px] w-auto min-w-[260px]">
                <SelectValue placeholder="Select advance" />
              </SelectTrigger>
              <SelectContent>
                {openAdvances.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.reference} · {a.remainingLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            advanceToShow && (
              <div className="text-[13px] text-muted-foreground truncate">
                <span className="font-mono text-foreground">
                  {advanceToShow.reference}
                </span>{" "}
                · {advanceToShow.remainingLabel}
              </div>
            )
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 shrink-0"
          onClick={() => advanceToShow && onLinkAdvance(advanceToShow.id)}
        >
          <Link2 className="h-3.5 w-3.5 mr-1.5" />
          Link to this claim
        </Button>
      </div>
    );
  };

  return (
    <div
      className="bg-card rounded-xl shadow-sm overflow-hidden"
      style={{
        border: "0.5px solid hsl(var(--border))",
        padding: "18px 20px",
      }}
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-[16px] font-medium text-foreground leading-tight">
            Claim details
          </h3>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Tell us why you're making this claim.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-[13px] px-3 shrink-0"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Hide details" : "View details"}
        </Button>
      </div>

      {/* Expandable metadata block */}
      <div
        className={cn(
          "grid transition-all duration-200 ease-out",
          expanded ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div
            className="rounded-lg"
            style={{
              background: "hsl(var(--muted) / 0.5)",
              padding: "12px 16px",
              marginBottom: "16px",
            }}
          >
            <dl className="text-[13px] space-y-2">
              <div className="flex items-center" style={{ gap: "16px" }}>
                <dt
                  className="text-muted-foreground font-normal"
                  style={{ width: "140px", flexShrink: 0 }}
                >
                  Claim number
                </dt>
                <dd className="text-foreground flex items-center gap-2 min-w-0">
                  <span className="font-mono truncate">
                    {claimNumber || "—"}
                  </span>
                  {claimNumber && (
                    <button
                      type="button"
                      onClick={copyClaimNumber}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      aria-label="Copy claim number"
                      title={copied ? "Copied" : "Copy"}
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-status-approved" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </dd>
              </div>
              <div className="flex items-center" style={{ gap: "16px" }}>
                <dt
                  className="text-muted-foreground font-normal"
                  style={{ width: "140px", flexShrink: 0 }}
                >
                  Created
                </dt>
                <dd className="text-foreground tabular-nums">{createdAtDisplay}</dd>
              </div>
              <div className="flex items-center" style={{ gap: "16px" }}>
                <dt
                  className="text-muted-foreground font-normal"
                  style={{ width: "140px", flexShrink: 0 }}
                >
                  Status
                </dt>
                <dd className="flex items-center gap-2">
                  <Badge variant="draft" className="text-[12px]">
                    {status}
                  </Badge>
                  <span className="text-muted-foreground text-[12px]">
                    Draft → Submitted → Approved
                  </span>
                </dd>
              </div>
              <div className="flex items-center" style={{ gap: "16px" }}>
                <dt
                  className="text-muted-foreground font-normal"
                  style={{ width: "140px", flexShrink: 0 }}
                >
                  Linked advance
                </dt>
                <dd className="text-foreground">
                  {linkedAdvance ? (
                    <span>
                      <span className="font-mono">{linkedAdvance.reference}</span>{" "}
                      <span className="text-muted-foreground">
                        · {linkedAdvance.remainingLabel}
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      None — banner appears above when one exists
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Banner */}
      {openAdvances.length > 0 && (
        <div className={cn(expanded ? "" : "mt-4", "mb-4")}>{renderBanner()}</div>
      )}

      {/* Purpose */}
      <div className={cn(openAdvances.length === 0 && !expanded ? "mt-4" : "")}>
        <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
          Purpose <span className="text-destructive">*</span>
        </label>
        <Textarea
          required
          rows={3}
          maxLength={1750}
          placeholder="What's this claim for? e.g., Visit customer at SCG Building to discuss Q3 promo"
          value={purpose}
          onChange={(e) => onPurposeChange(e.target.value)}
          className={cn(
            "text-sm resize-none mt-1.5",
            overLimit && "border-status-alert focus-visible:ring-status-alert/30",
          )}
          style={{ borderRadius: "8px", padding: "12px" }}
        />
        <p
          className={cn(
            "text-[11px] mt-1.5",
            overLimit ? "text-destructive font-medium" : "text-muted-foreground",
          )}
        >
          Required · {words} / 250 words
        </p>
      </div>
    </div>
  );
}
