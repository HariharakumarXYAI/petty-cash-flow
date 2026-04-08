import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Building2, Users, GitBranch, Mail } from "lucide-react";

const bgColors: Record<string, string> = {
  Wholesale: "bg-blue-100 text-blue-700 border-blue-200",
  Retail: "bg-green-100 text-green-700 border-green-200",
  "Food Service": "bg-amber-100 text-amber-700 border-amber-200",
  "Property-Mall": "bg-purple-100 text-purple-700 border-purple-200",
  International: "bg-sky-100 text-sky-700 border-sky-200",
};

const mockEntities = [
  { code: "CPA001", name: "บริษัท ซีพี แอ็กซ์ตร้า จำกัด (มหาชน)", nameEn: "CP Axtra Public Company Limited", businessGroup: "Wholesale", oracleCode: "10001", taxId: "0105500000001", entityType: "สำนักงานใหญ่", start: "2026-01-01", end: "2030-12-31", status: "Active", loaRef: "ตาราง 1 (Wholesale)", currency: "THB", ultimateApprover: { name: "คุณสมชาย วงศ์ใหญ่", position: "CEO", email: "somchai.w@cpaxtra.com" }, financeController: { name: "คุณสมหญิง จันทร์ดี", position: "CFO", email: "somying.c@cpaxtra.com" }, linkedBU: 4, linkedEmployees: 1250, linkedBranches: 18 },
  { code: "MKR002", name: "บริษัท แม็คโคร จำกัด (มหาชน)", nameEn: "Makro Public Company Limited", businessGroup: "Wholesale", oracleCode: "10002", taxId: "0105500000002", entityType: "สำนักงานใหญ่", start: "2026-01-01", end: "2030-12-31", status: "Active", loaRef: "ตาราง 1 (Wholesale)", currency: "THB", ultimateApprover: { name: "คุณวิชัย ศรีสุข", position: "Managing Director", email: "wichai.s@makro.com" }, financeController: { name: "คุณนภา รัตนกุล", position: "Finance Director", email: "napa.r@makro.com" }, linkedBU: 3, linkedEmployees: 890, linkedBranches: 12 },
  { code: "DEM003", name: "บริษัท เดโม จำกัด", nameEn: "Demo Company Limited", businessGroup: "Retail", oracleCode: "13000", taxId: "0105500000003", entityType: "สาขา", start: "2025-06-01", end: "2026-12-31", status: "Inactive", loaRef: "ตาราง 1 (Retail)", currency: "THB", ultimateApprover: { name: "คุณพิชัย ธนาพร", position: "General Manager", email: "pichai.t@demo.com" }, financeController: { name: "คุณสมชาย วงศ์ใหญ่", position: "CFO", email: "somchai.w@demo.com" }, linkedBU: 1, linkedEmployees: 45, linkedBranches: 2 },
];

const coaSegments = [
  { label: "Seg 1", desc: "Company", dynamic: true },
  { label: "Seg 2", desc: "Account", source: "from expense type" },
  { label: "Seg 3", desc: "Division", source: "from employee" },
  { label: "Seg 4", desc: "Location", source: "from branch" },
  { label: "Seg 5", desc: "Project", source: "default" },
  { label: "Seg 6", desc: "Future 1", source: "default" },
  { label: "Seg 7", desc: "Future 2", source: "default" },
  { label: "Seg 8", desc: "Future 3", source: "default" },
  { label: "Seg 9", desc: "Future 4", source: "default" },
  { label: "Seg 10", desc: "Future 5", source: "default" },
  { label: "Seg 11", desc: "Future 6", source: "default" },
];

function InfoField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium text-foreground ${mono ? "font-mono" : ""}`}>{value || "—"}</p>
    </div>
  );
}

function PersonCard({ name, position, email }: { name: string; position: string; email: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
        {name.charAt(0)}
      </div>
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-semibold text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{position}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Mail className="h-3 w-3" />
          <span>{email}</span>
        </div>
      </div>
    </div>
  );
}

export default function EntityDetailPage() {
  const { entityCode } = useParams();
  const navigate = useNavigate();
  const entity = mockEntities.find((e) => e.code === entityCode);

  if (!entity) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-foreground">Entity not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/entities")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Entities
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" className="mt-1" onClick={() => navigate("/admin/entities")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="inline-block rounded bg-muted px-3 py-1 font-mono text-lg font-bold">{entity.code}</span>
              <Badge variant="outline" className={bgColors[entity.businessGroup] || ""}>{entity.businessGroup}</Badge>
              <Badge variant={entity.status === "Active" ? "default" : "secondary"} className={entity.status === "Active" ? "bg-status-approved/10 text-status-approved border-status-approved/20" : ""}>
                {entity.status}
              </Badge>
            </div>
            <h1 className="text-xl font-semibold text-foreground">{entity.name}</h1>
            <p className="text-sm text-muted-foreground">{entity.nameEn}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate("/admin/entities")}>
          <Pencil className="h-4 w-4 mr-1" /> Edit
        </Button>
      </div>

      {/* SECTION 1 — Basic Information */}
      <div className="rounded-lg border bg-card">
        <div className="border-b px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">Basic Information</h2>
        </div>
        <div className="grid grid-cols-3 gap-x-8 gap-y-5 p-5">
          <InfoField label="Entity Code" value={entity.code} mono />
          <InfoField label="Legal Entity Name (TH)" value={entity.name} />
          <InfoField label="Legal Entity Name (EN)" value={entity.nameEn} />
          <InfoField label="Primary Tax ID" value={entity.taxId} mono />
          <InfoField label="Entity Type" value={entity.entityType} />
          <InfoField label="Business Group" value={entity.businessGroup} />
          <InfoField label="Oracle Code" value={entity.oracleCode} mono />
          <InfoField label="Default Currency" value={entity.currency} />
          <InfoField label="Effective Start" value={entity.start} />
          <InfoField label="Effective End" value={entity.end} />
          <InfoField label="LOA Table Reference" value={entity.loaRef} />
          <InfoField label="Status" value={entity.status} />
        </div>
      </div>

      {/* SECTION 2 — Approval Authority */}
      <div className="rounded-lg border bg-card">
        <div className="border-b px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">Approval Authority</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 p-5">
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Ultimate Approver</p>
            <PersonCard {...entity.ultimateApprover} />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Finance Controller / CFO</p>
            <PersonCard {...entity.financeController} />
          </div>
        </div>
      </div>

      {/* SECTION 3 — Oracle COA Preview */}
      <div className="rounded-lg border bg-card">
        <div className="border-b px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">Oracle COA Preview</h2>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex gap-1.5 overflow-x-auto">
            {coaSegments.map((seg, i) => {
              const isHighlighted = i === 0;
              return (
                <div
                  key={seg.label}
                  className={`flex flex-col items-center justify-center rounded-md border px-3 py-2 min-w-[90px] text-center ${
                    isHighlighted
                      ? "border-blue-300 bg-blue-50 text-blue-700"
                      : "border-border bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <span className="text-[10px] font-medium opacity-70">{seg.label}</span>
                  <span className={`text-xs font-semibold ${isHighlighted ? "font-mono" : ""}`}>
                    {isHighlighted ? entity.oracleCode : seg.desc}
                  </span>
                  {!isHighlighted && seg.source && (
                    <span className="text-[9px] opacity-60">{seg.source}</span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-200 mr-1 align-middle" /> Blue = set here &nbsp;·&nbsp;
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-muted mr-1 align-middle" /> Gray = set in other master data
          </p>
        </div>
      </div>

      {/* SECTION 4 — Linked Records */}
      <div className="rounded-lg border bg-card">
        <div className="border-b px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">Linked Records</h2>
        </div>
        <div className="grid grid-cols-3 gap-4 p-5">
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{entity.linkedBU}</p>
              <p className="text-xs text-muted-foreground">Business Units</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{entity.linkedEmployees.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Employees</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <GitBranch className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{entity.linkedBranches}</p>
              <p className="text-xs text-muted-foreground">Branches</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
