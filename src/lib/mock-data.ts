export type ClaimStatus =
  | "Draft"
  | "Submitted"
  | "OCR Validating"
  | "Auto Approved"
  | "Auto Approved with Alert"
  | "On Hold"
  | "Under Investigation"
  | "Awaiting Audit Document"
  | "Settled"
  | "Rejected";

export const statusToBadgeVariant: Record<ClaimStatus, string> = {
  "Draft": "draft",
  "Submitted": "submitted",
  "OCR Validating": "validating",
  "Auto Approved": "approved",
  "Auto Approved with Alert": "alert",
  "On Hold": "hold",
  "Under Investigation": "investigation",
  "Awaiting Audit Document": "audit",
  "Settled": "settled",
  "Rejected": "rejected",
};

export interface Claim {
  id: string;
  claimNumber: string;
  store: string;
  country: string;
  submitter: string;
  expenseType: string;
  amount: number;
  currency: string;
  status: ClaimStatus;
  submittedAt: string;
  receiptDate: string;
}

export interface Alert {
  id: string;
  type: "anomaly" | "duplicate" | "limit_breach" | "prohibited";
  severity: "high" | "medium" | "low";
  title: string;
  store: string;
  country: string;
  createdAt: string;
}

export const mockClaims: Claim[] = [
  { id: "1", claimNumber: "PC-TH-2026-00142", store: "Makro Bangkapi", country: "TH", submitter: "Somchai P.", expenseType: "Office Supplies", amount: 1250, currency: "THB", status: "Auto Approved", submittedAt: "2026-03-06T09:12:00", receiptDate: "2026-03-05" },
  { id: "2", claimNumber: "PC-TH-2026-00141", store: "Makro Sathorn", country: "TH", submitter: "Napaporn S.", expenseType: "Cleaning Supplies", amount: 3800, currency: "THB", status: "Auto Approved with Alert", submittedAt: "2026-03-06T08:45:00", receiptDate: "2026-03-05" },
  { id: "3", claimNumber: "PC-KH-2026-00038", store: "Makro Phnom Penh 1", country: "KH", submitter: "Sok V.", expenseType: "Maintenance", amount: 125, currency: "USD", status: "On Hold", submittedAt: "2026-03-06T07:30:00", receiptDate: "2026-03-04" },
  { id: "4", claimNumber: "PC-MM-2026-00021", store: "Makro Yangon Central", country: "MM", submitter: "Aung T.", expenseType: "Transportation", amount: 85000, currency: "MMK", status: "OCR Validating", submittedAt: "2026-03-06T10:01:00", receiptDate: "2026-03-06" },
  { id: "5", claimNumber: "PC-TH-2026-00140", store: "Makro Rama 4", country: "TH", submitter: "Prasert K.", expenseType: "Refreshments", amount: 920, currency: "THB", status: "Under Investigation", submittedAt: "2026-03-05T16:22:00", receiptDate: "2026-03-05" },
  { id: "6", claimNumber: "PC-TH-2026-00139", store: "Makro Chaengwattana", country: "TH", submitter: "Wanida R.", expenseType: "Office Supplies", amount: 2100, currency: "THB", status: "Settled", submittedAt: "2026-03-04T11:15:00", receiptDate: "2026-03-03" },
  { id: "7", claimNumber: "PC-KH-2026-00037", store: "Makro Siem Reap", country: "KH", submitter: "Chan D.", expenseType: "Postage", amount: 45, currency: "USD", status: "Auto Approved", submittedAt: "2026-03-05T14:30:00", receiptDate: "2026-03-05" },
  { id: "8", claimNumber: "PC-TH-2026-00138", store: "Makro Bangkapi", country: "TH", submitter: "Somchai P.", expenseType: "Printing", amount: 680, currency: "THB", status: "Draft", submittedAt: "2026-03-06T10:30:00", receiptDate: "2026-03-06" },
  { id: "9", claimNumber: "PC-MM-2026-00020", store: "Makro Mandalay", country: "MM", submitter: "Myint Z.", expenseType: "Cleaning Supplies", amount: 52000, currency: "MMK", status: "Rejected", submittedAt: "2026-03-03T09:00:00", receiptDate: "2026-03-02" },
  { id: "10", claimNumber: "PC-TH-2026-00137", store: "Makro Sathorn", country: "TH", submitter: "Napaporn S.", expenseType: "Office Supplies", amount: 1580, currency: "THB", status: "Awaiting Audit Document", submittedAt: "2026-03-02T13:45:00", receiptDate: "2026-03-01" },
];

export const mockAlerts: Alert[] = [
  { id: "1", type: "anomaly", severity: "high", title: "Cleaning spend 340% above peer avg", store: "Makro Sathorn", country: "TH", createdAt: "2026-03-06T08:50:00" },
  { id: "2", type: "duplicate", severity: "high", title: "Possible duplicate receipt detected", store: "Makro Phnom Penh 1", country: "KH", createdAt: "2026-03-06T07:35:00" },
  { id: "3", type: "limit_breach", severity: "medium", title: "Single txn exceeds store daily limit", store: "Makro Yangon Central", country: "MM", createdAt: "2026-03-05T15:10:00" },
  { id: "4", type: "anomaly", severity: "low", title: "Refreshment spend 180% vs last year", store: "Makro Rama 4", country: "TH", createdAt: "2026-03-05T16:25:00" },
];

export const dashboardMetrics = {
  todayClaims: 14,
  pendingExceptions: 3,
  autoApprovalRate: 87,
  totalFloatBalance: { TH: 245000, KH: 3200, MM: 1850000 },
  alertsOpen: 4,
  mtdSpend: { TH: 1245000, KH: 18500, MM: 12500000 },
};
