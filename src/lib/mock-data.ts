// =============================================
// PettyCash 360 — Comprehensive Mock Data
// =============================================

// --- Types ---

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

export type BadgeVariant =
  | "draft" | "submitted" | "validating" | "approved" | "alert"
  | "hold" | "investigation" | "audit" | "settled" | "rejected";

export const statusToBadgeVariant: Record<ClaimStatus, BadgeVariant> = {
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

export type AlertType = "anomaly" | "duplicate" | "limit_breach" | "prohibited";
export type Severity = "critical" | "high" | "medium" | "low";
export type Country = "TH" | "KH" | "MM";
export type StoreType = "Hypermarket" | "Supermarket" | "Mini";

export interface StoreInfo {
  id: string;
  name: string;
  country: Country;
  type: StoreType;
  legalEntity: string;
  currency: string;
  floatLimit: number;
  minBalance: number;
  maxFloat: number;
  replenishmentThreshold: number;
  currentBalance: number;
}

export interface ExpenseType {
  id: string;
  category: string;
  subcategory: string;
  countries: Country[];
  documentRequired: boolean;
  maxAmount: number;
  alertThreshold: number;
  hardStopThreshold: number;
  advanceAllowed: boolean;
  reimbursementAllowed: boolean;
  auditSensitive: boolean;
}

export interface Claim {
  id: string;
  claimNumber: string;
  storeId: string;
  store: string;
  country: Country;
  storeType: StoreType;
  submitter: string;
  expenseType: string;
  subcategory: string;
  amount: number;
  currency: string;
  status: ClaimStatus;
  submittedAt: string;
  receiptDate: string;
  vendor: string;
  notes: string;
  ocrConfidence: number;
  hasAlert: boolean;
  paymentMode: string;
  linkedAdvanceId?: string;
}

export interface Advance {
  id: string;
  advanceNumber: string;
  storeId: string;
  store: string;
  country: Country;
  recipient: string;
  purpose: string;
  amount: number;
  currency: string;
  issuedDate: string;
  dueDate: string;
  settledAmount: number;
  returnedCash: number;
  status: "Open" | "Partially Settled" | "Settled" | "Overdue" | "Blocked";
  daysOutstanding: number;
}

export interface CashbookEntry {
  id: string;
  date: string;
  type: "Opening Balance" | "Cash In" | "Replenishment" | "Claim Payout" | "Advance Issue" | "Settlement Return" | "Adjustment" | "Cash Count";
  reference: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface AlertRecord {
  id: string;
  type: AlertType;
  severity: Severity;
  title: string;
  description: string;
  storeId: string;
  store: string;
  country: Country;
  storeType: StoreType;
  expenseCategory: string;
  amountDeviation: number;
  peerBenchmark: number;
  actualAmount: number;
  yoyChange: number;
  assignedTo: string;
  status: "Open" | "In Progress" | "Escalated" | "Closed";
  createdAt: string;
  linkedClaimId?: string;
  reasonCodes: string[];
  notes: string[];
}

export interface Investigation {
  id: string;
  caseNumber: string;
  title: string;
  store: string;
  country: Country;
  status: "Open" | "In Progress" | "Pending Evidence" | "Resolved" | "Escalated";
  severity: Severity;
  owner: string;
  createdAt: string;
  daysOpen: number;
  linkedAlertIds: string[];
  linkedClaimIds: string[];
  evidenceChecklist: { item: string; completed: boolean }[];
  notes: { author: string; date: string; text: string }[];
  category: string;
  totalAmount: number;
  currency: string;
}

export interface AuditRequest {
  id: string;
  auditNumber: string;
  claimId: string;
  claimNumber: string;
  store: string;
  country: Country;
  requestedDate: string;
  requestedFrom: string;
  status: "Requested" | "Shipped" | "Received" | "Under Review" | "Finding Recorded" | "Completed";
  receivedDate?: string;
  reviewedDate?: string;
  findingSeverity?: "None" | "Low" | "Medium" | "High" | "Critical";
  findingSummary?: string;
}

// --- Countries & Currencies ---

export const countries = [
  { code: "TH" as Country, name: "Thailand", currency: "THB", flag: "🇹🇭" },
  { code: "KH" as Country, name: "Cambodia", currency: "KHR", flag: "🇰🇭" },
  { code: "MM" as Country, name: "Myanmar", currency: "MMK", flag: "🇲🇲" },
];

// --- Stores ---

export const stores: StoreInfo[] = [
  { id: "s1", name: "Makro Bangkapi", country: "TH", type: "Hypermarket", legalEntity: "Siam Makro PCL", currency: "THB", floatLimit: 50000, minBalance: 10000, maxFloat: 80000, replenishmentThreshold: 15000, currentBalance: 42500 },
  { id: "s2", name: "Makro Sathorn", country: "TH", type: "Supermarket", legalEntity: "Siam Makro PCL", currency: "THB", floatLimit: 30000, minBalance: 5000, maxFloat: 50000, replenishmentThreshold: 8000, currentBalance: 6200 },
  { id: "s3", name: "Makro Rama 4", country: "TH", type: "Hypermarket", legalEntity: "Siam Makro PCL", currency: "THB", floatLimit: 50000, minBalance: 10000, maxFloat: 80000, replenishmentThreshold: 15000, currentBalance: 38900 },
  { id: "s4", name: "Makro Chaengwattana", country: "TH", type: "Mini", legalEntity: "Siam Makro PCL", currency: "THB", floatLimit: 15000, minBalance: 3000, maxFloat: 25000, replenishmentThreshold: 5000, currentBalance: 4100 },
  { id: "s5", name: "Makro Pattaya", country: "TH", type: "Hypermarket", legalEntity: "Siam Makro PCL", currency: "THB", floatLimit: 50000, minBalance: 10000, maxFloat: 80000, replenishmentThreshold: 15000, currentBalance: 31200 },
  { id: "s6", name: "Makro Chiang Mai", country: "TH", type: "Supermarket", legalEntity: "Siam Makro PCL", currency: "THB", floatLimit: 30000, minBalance: 5000, maxFloat: 50000, replenishmentThreshold: 8000, currentBalance: 22800 },
  { id: "s7", name: "Makro Phnom Penh 1", country: "KH", type: "Hypermarket", legalEntity: "Makro Cambodia Co Ltd", currency: "KHR", floatLimit: 2000, minBalance: 500, maxFloat: 3500, replenishmentThreshold: 700, currentBalance: 1450 },
  { id: "s8", name: "Makro Siem Reap", country: "KH", type: "Supermarket", legalEntity: "Makro Cambodia Co Ltd", currency: "KHR", floatLimit: 1200, minBalance: 300, maxFloat: 2000, replenishmentThreshold: 400, currentBalance: 320 },
  { id: "s9", name: "Makro Yangon Central", country: "MM", type: "Hypermarket", legalEntity: "Makro Myanmar Ltd", currency: "MMK", floatLimit: 3000000, minBalance: 500000, maxFloat: 5000000, replenishmentThreshold: 800000, currentBalance: 2100000 },
  { id: "s10", name: "Makro Mandalay", country: "MM", type: "Supermarket", legalEntity: "Makro Myanmar Ltd", currency: "MMK", floatLimit: 1500000, minBalance: 300000, maxFloat: 2500000, replenishmentThreshold: 500000, currentBalance: 890000 },
];

// --- Expense Types ---

export const expenseTypes: ExpenseType[] = [
  { id: "e1", category: "Office Supplies", subcategory: "Stationery", countries: ["TH", "KH", "MM"], documentRequired: true, maxAmount: 5000, alertThreshold: 3000, hardStopThreshold: 8000, advanceAllowed: false, reimbursementAllowed: true, auditSensitive: false },
  { id: "e2", category: "Cleaning Supplies", subcategory: "General Cleaning", countries: ["TH", "KH", "MM"], documentRequired: true, maxAmount: 10000, alertThreshold: 6000, hardStopThreshold: 15000, advanceAllowed: false, reimbursementAllowed: true, auditSensitive: false },
  { id: "e3", category: "Maintenance", subcategory: "Minor Repairs", countries: ["TH", "KH", "MM"], documentRequired: true, maxAmount: 15000, alertThreshold: 10000, hardStopThreshold: 25000, advanceAllowed: true, reimbursementAllowed: true, auditSensitive: true },
  { id: "e4", category: "Transportation", subcategory: "Local Transport", countries: ["TH", "KH", "MM"], documentRequired: true, maxAmount: 3000, alertThreshold: 2000, hardStopThreshold: 5000, advanceAllowed: true, reimbursementAllowed: true, auditSensitive: false },
  { id: "e5", category: "Refreshments", subcategory: "Staff Refreshments", countries: ["TH", "KH", "MM"], documentRequired: true, maxAmount: 2000, alertThreshold: 1500, hardStopThreshold: 3000, advanceAllowed: false, reimbursementAllowed: true, auditSensitive: true },
  { id: "e6", category: "Postage", subcategory: "Courier & Mail", countries: ["TH", "KH", "MM"], documentRequired: true, maxAmount: 1500, alertThreshold: 1000, hardStopThreshold: 3000, advanceAllowed: false, reimbursementAllowed: true, auditSensitive: false },
  { id: "e7", category: "Printing", subcategory: "Document Printing", countries: ["TH", "KH", "MM"], documentRequired: true, maxAmount: 3000, alertThreshold: 2000, hardStopThreshold: 5000, advanceAllowed: false, reimbursementAllowed: true, auditSensitive: false },
  { id: "e8", category: "Utilities", subcategory: "Minor Utilities", countries: ["TH"], documentRequired: true, maxAmount: 5000, alertThreshold: 3500, hardStopThreshold: 8000, advanceAllowed: false, reimbursementAllowed: true, auditSensitive: false },
  { id: "e9", category: "Security", subcategory: "Security Services", countries: ["TH", "KH", "MM"], documentRequired: true, maxAmount: 8000, alertThreshold: 5000, hardStopThreshold: 12000, advanceAllowed: true, reimbursementAllowed: true, auditSensitive: true },
  { id: "e10", category: "Entertainment", subcategory: "Business Entertainment", countries: ["TH"], documentRequired: true, maxAmount: 5000, alertThreshold: 3000, hardStopThreshold: 8000, advanceAllowed: false, reimbursementAllowed: true, auditSensitive: true },

  // --- Local Travelling sub-types (drive per-line doc policy) ---
  { id: "lt-taxi",       category: "Local Travelling", subcategory: "Taxi / Grab",         countries: ["TH","KH","MM"], documentRequired: true, maxAmount: 2000,  alertThreshold: 1500, hardStopThreshold: 3000,  advanceAllowed: true,  reimbursementAllowed: true, auditSensitive: false },
  { id: "lt-train",      category: "Local Travelling", subcategory: "Train / Inter-city",   countries: ["TH","KH","MM"], documentRequired: true, maxAmount: 5000,  alertThreshold: 3500, hardStopThreshold: 8000,  advanceAllowed: true,  reimbursementAllowed: true, auditSensitive: false },
  { id: "lt-car",        category: "Local Travelling", subcategory: "Personal Car / EV",    countries: ["TH","KH","MM"], documentRequired: true, maxAmount: 8000,  alertThreshold: 5000, hardStopThreshold: 12000, advanceAllowed: true,  reimbursementAllowed: true, auditSensitive: true  },
  { id: "lt-toll",       category: "Local Travelling", subcategory: "Toll Fees",            countries: ["TH","KH","MM"], documentRequired: true, maxAmount: 1500,  alertThreshold: 1000, hardStopThreshold: 2500,  advanceAllowed: false, reimbursementAllowed: true, auditSensitive: false },
  { id: "lt-airpark",    category: "Local Travelling", subcategory: "Airport Parking",      countries: ["TH","KH","MM"], documentRequired: true, maxAmount: 2000,  alertThreshold: 1500, hardStopThreshold: 3500,  advanceAllowed: false, reimbursementAllowed: true, auditSensitive: false },
  { id: "lt-otherpark",  category: "Local Travelling", subcategory: "Other Parking",        countries: ["TH","KH","MM"], documentRequired: true, maxAmount: 1500,  alertThreshold: 1000, hardStopThreshold: 2500,  advanceAllowed: false, reimbursementAllowed: true, auditSensitive: false },
  { id: "lt-rental",     category: "Local Travelling", subcategory: "Car Rental",           countries: ["TH","KH","MM"], documentRequired: true, maxAmount: 15000, alertThreshold: 10000,hardStopThreshold: 25000, advanceAllowed: true,  reimbursementAllowed: true, auditSensitive: true  },
  { id: "lt-air-dom",    category: "Local Travelling", subcategory: "Airline Domestic",     countries: ["TH","KH","MM"], documentRequired: true, maxAmount: 12000, alertThreshold: 8000, hardStopThreshold: 20000, advanceAllowed: true,  reimbursementAllowed: true, auditSensitive: true  },
  { id: "lt-hotel-dom",  category: "Local Travelling", subcategory: "Hotel Domestic",       countries: ["TH","KH","MM"], documentRequired: true, maxAmount: 20000, alertThreshold: 12000,hardStopThreshold: 35000, advanceAllowed: true,  reimbursementAllowed: true, auditSensitive: true  },
  { id: "lt-meal",       category: "Local Travelling", subcategory: "Meal Restaurant",      countries: ["TH","KH","MM"], documentRequired: true, maxAmount: 3000,  alertThreshold: 2000, hardStopThreshold: 5000,  advanceAllowed: true,  reimbursementAllowed: true, auditSensitive: true  },
  { id: "lt-perdiem",    category: "Local Travelling", subcategory: "Per Diem Domestic",    countries: ["TH","KH","MM"], documentRequired: true, maxAmount: 2500,  alertThreshold: 2000, hardStopThreshold: 4000,  advanceAllowed: true,  reimbursementAllowed: true, auditSensitive: false },
  { id: "lt-postage",    category: "Local Travelling", subcategory: "Postage Courier",      countries: ["TH","KH","MM"], documentRequired: true, maxAmount: 1500,  alertThreshold: 1000, hardStopThreshold: 3000,  advanceAllowed: false, reimbursementAllowed: true, auditSensitive: false },
  { id: "lt-night",      category: "Local Travelling", subcategory: "Night Shift Meal",     countries: ["TH","KH","MM"], documentRequired: true, maxAmount: 500,   alertThreshold: 400,  hardStopThreshold: 800,   advanceAllowed: false, reimbursementAllowed: true, auditSensitive: false },
];

// --- Sub-Expense-Type Document Policy ---
// Drives per-line "Required documents" zones in /claims/new editor pane.

export type DocTypeCode =
  | "RECEIPT" | "E_TICKET" | "TAX_INVOICE" | "TRAVEL_APPROVAL"
  | "BOARDING_PASS" | "HOTEL_FOLIO" | "FUEL_RECEIPT"
  | "MILEAGE_TEXT" | "MEMO" | "CLAIM_FORM";

export type DocRequirement = "REQUIRED" | "OPTIONAL" | "ALTERNATIVE";
export type DocSlotKind = "FILE" | "STRUCTURED_TEXT";

export interface DocPolicyRow {
  subExpenseTypeId: string;     // expenseTypes.id
  docTypeCode: DocTypeCode;
  requirement: DocRequirement;
  alternativeGroupId?: string;  // same id within same subType = OR group
  thresholdAmount?: number;     // only render slot when line amount > threshold
  kind: DocSlotKind;            // FILE = upload, STRUCTURED_TEXT = inline fields
  ocrTemplateId?: string;
}

export const DOC_TYPE_LABEL: Record<DocTypeCode, string> = {
  RECEIPT:          "Receipt",
  E_TICKET:         "E-Ticket",
  TAX_INVOICE:      "Tax Invoice",
  TRAVEL_APPROVAL:  "Travel Approval",
  BOARDING_PASS:    "Boarding Pass",
  HOTEL_FOLIO:      "Hotel Folio",
  FUEL_RECEIPT:     "Fuel Receipt",
  MILEAGE_TEXT:     "Mileage Log",
  MEMO:             "Memo / Justification",
  CLAIM_FORM:       "Claim Form",
};

export const subExpenseTypeDocPolicy: DocPolicyRow[] = [
  // Taxi / Grab — Receipt OR Claim Form; Memo above 1,500 THB
  { subExpenseTypeId: "lt-taxi",      docTypeCode: "RECEIPT",         requirement: "ALTERNATIVE", alternativeGroupId: "taxi-proof", kind: "FILE", ocrTemplateId: "tpl-receipt" },
  { subExpenseTypeId: "lt-taxi",      docTypeCode: "CLAIM_FORM",      requirement: "ALTERNATIVE", alternativeGroupId: "taxi-proof", kind: "FILE" },
  { subExpenseTypeId: "lt-taxi",      docTypeCode: "MEMO",            requirement: "REQUIRED",    thresholdAmount: 1500, kind: "FILE" },

  // Train / Inter-city — Receipt OR Claim Form
  { subExpenseTypeId: "lt-train",     docTypeCode: "RECEIPT",         requirement: "ALTERNATIVE", alternativeGroupId: "train-proof", kind: "FILE", ocrTemplateId: "tpl-receipt" },
  { subExpenseTypeId: "lt-train",     docTypeCode: "CLAIM_FORM",      requirement: "ALTERNATIVE", alternativeGroupId: "train-proof", kind: "FILE" },

  // Personal Car / EV — Fuel receipt + structured Mileage
  { subExpenseTypeId: "lt-car",       docTypeCode: "FUEL_RECEIPT",    requirement: "REQUIRED",    kind: "FILE", ocrTemplateId: "tpl-fuel" },
  { subExpenseTypeId: "lt-car",       docTypeCode: "MILEAGE_TEXT",    requirement: "REQUIRED",    kind: "STRUCTURED_TEXT" },

  // Toll Fees
  { subExpenseTypeId: "lt-toll",      docTypeCode: "RECEIPT",         requirement: "REQUIRED",    kind: "FILE", ocrTemplateId: "tpl-receipt" },

  // Airport Parking
  { subExpenseTypeId: "lt-airpark",   docTypeCode: "RECEIPT",         requirement: "REQUIRED",    kind: "FILE", ocrTemplateId: "tpl-receipt" },

  // Other Parking
  { subExpenseTypeId: "lt-otherpark", docTypeCode: "RECEIPT",         requirement: "REQUIRED",    kind: "FILE", ocrTemplateId: "tpl-receipt" },

  // Car Rental — Receipt + Travel Approval
  { subExpenseTypeId: "lt-rental",    docTypeCode: "RECEIPT",         requirement: "REQUIRED",    kind: "FILE", ocrTemplateId: "tpl-receipt" },
  { subExpenseTypeId: "lt-rental",    docTypeCode: "TRAVEL_APPROVAL", requirement: "REQUIRED",    kind: "FILE" },

  // Airline Domestic — E-Ticket + Travel Approval + (Tax Invoice OR Receipt) + Boarding Pass (opt)
  { subExpenseTypeId: "lt-air-dom",   docTypeCode: "E_TICKET",        requirement: "REQUIRED",    kind: "FILE", ocrTemplateId: "tpl-eticket" },
  { subExpenseTypeId: "lt-air-dom",   docTypeCode: "TRAVEL_APPROVAL", requirement: "REQUIRED",    kind: "FILE" },
  { subExpenseTypeId: "lt-air-dom",   docTypeCode: "TAX_INVOICE",     requirement: "ALTERNATIVE", alternativeGroupId: "air-fiscal", kind: "FILE", ocrTemplateId: "tpl-tax-invoice" },
  { subExpenseTypeId: "lt-air-dom",   docTypeCode: "RECEIPT",         requirement: "ALTERNATIVE", alternativeGroupId: "air-fiscal", kind: "FILE", ocrTemplateId: "tpl-receipt" },
  { subExpenseTypeId: "lt-air-dom",   docTypeCode: "BOARDING_PASS",   requirement: "OPTIONAL",    kind: "FILE" },

  // Hotel Domestic — Folio + Travel Approval
  { subExpenseTypeId: "lt-hotel-dom", docTypeCode: "HOTEL_FOLIO",     requirement: "REQUIRED",    kind: "FILE", ocrTemplateId: "tpl-folio" },
  { subExpenseTypeId: "lt-hotel-dom", docTypeCode: "TRAVEL_APPROVAL", requirement: "REQUIRED",    kind: "FILE" },

  // Meal Restaurant — Claim Form + Travel Approval; Receipt optional
  { subExpenseTypeId: "lt-meal",      docTypeCode: "CLAIM_FORM",      requirement: "REQUIRED",    kind: "FILE" },
  { subExpenseTypeId: "lt-meal",      docTypeCode: "TRAVEL_APPROVAL", requirement: "REQUIRED",    kind: "FILE" },
  { subExpenseTypeId: "lt-meal",      docTypeCode: "RECEIPT",         requirement: "OPTIONAL",    kind: "FILE", ocrTemplateId: "tpl-receipt" },

  // Per Diem Domestic — Claim Form + Travel Approval
  { subExpenseTypeId: "lt-perdiem",   docTypeCode: "CLAIM_FORM",      requirement: "REQUIRED",    kind: "FILE" },
  { subExpenseTypeId: "lt-perdiem",   docTypeCode: "TRAVEL_APPROVAL", requirement: "REQUIRED",    kind: "FILE" },

  // Postage Courier
  { subExpenseTypeId: "lt-postage",   docTypeCode: "RECEIPT",         requirement: "REQUIRED",    kind: "FILE", ocrTemplateId: "tpl-receipt" },

  // Night Shift Meal
  { subExpenseTypeId: "lt-night",     docTypeCode: "RECEIPT",         requirement: "REQUIRED",    kind: "FILE", ocrTemplateId: "tpl-receipt" },
];

export const getDocPolicyForSubType = (subExpenseTypeId: string): DocPolicyRow[] =>
  subExpenseTypeDocPolicy.filter(p => p.subExpenseTypeId === subExpenseTypeId);

// --- Employee Profile Lookup (submitter → employee metadata) ---

export interface EmployeeProfile {
  name: string;
  employeeType: "HO" | "Store";
  positionLevel: string;
  storeId?: string;
  storeName?: string;
}

export const employeeProfiles: EmployeeProfile[] = [
  { name: "Somchai Prasert", employeeType: "Store", positionLevel: "Store Manager – Hypermarket", storeId: "s1", storeName: "Makro Bangkapi" },
  { name: "Napaporn Suksai", employeeType: "Store", positionLevel: "Staff", storeId: "s2", storeName: "Makro Sathorn" },
  { name: "Sok Vannak", employeeType: "Store", positionLevel: "Store Manager – Hypermarket", storeId: "s7", storeName: "Makro Phnom Penh 1" },
  { name: "Aung Thura", employeeType: "Store", positionLevel: "Store Manager – Hypermarket", storeId: "s9", storeName: "Makro Yangon Central" },
  { name: "Prasert Kittisak", employeeType: "HO", positionLevel: "Senior Manager", storeId: undefined, storeName: undefined },
  { name: "Wanida Rattana", employeeType: "Store", positionLevel: "Store Manager – Mini", storeId: "s4", storeName: "Makro Chaengwattana" },
  { name: "Chan Dara", employeeType: "Store", positionLevel: "Staff", storeId: "s8", storeName: "Makro Siem Reap" },
  { name: "Kwanchai Maneerat", employeeType: "HO", positionLevel: "Associate Director", storeId: undefined, storeName: undefined },
  { name: "Sompong Chaiyasit", employeeType: "Store", positionLevel: "Area Manager", storeId: "s5", storeName: "Makro Pattaya" },
  { name: "Lek Worachai", employeeType: "Store", positionLevel: "Store Manager – Supermarket", storeId: "s6", storeName: "Makro Chiang Mai" },
  { name: "Myint Zaw", employeeType: "Store", positionLevel: "Staff", storeId: "s10", storeName: "Makro Mandalay" },
];

export const getEmployeeProfile = (submitterName: string): EmployeeProfile | undefined =>
  employeeProfiles.find(e => e.name === submitterName);

// --- Claims ---

export const claims: Claim[] = [
  { id: "c1", claimNumber: "PC-TH-2026-00142", storeId: "s1", store: "Makro Bangkapi", country: "TH", storeType: "Hypermarket", submitter: "Somchai Prasert", expenseType: "Office Supplies", subcategory: "Stationery", amount: 1250, currency: "THB", status: "Auto Approved", submittedAt: "2026-03-06T09:12:00", receiptDate: "2026-03-05", vendor: "OfficeMate", notes: "Monthly stationery restock", ocrConfidence: 96, hasAlert: false, paymentMode: "Cash" },
  { id: "c2", claimNumber: "PC-TH-2026-00141", storeId: "s2", store: "Makro Sathorn", country: "TH", storeType: "Supermarket", submitter: "Napaporn Suksai", expenseType: "Cleaning Supplies", subcategory: "General Cleaning", amount: 8500, currency: "THB", status: "Auto Approved with Alert", submittedAt: "2026-03-06T08:45:00", receiptDate: "2026-03-05", vendor: "CleanPro Thailand", notes: "Bulk cleaning order", ocrConfidence: 91, hasAlert: true, paymentMode: "Cash" },
  { id: "c3", claimNumber: "PC-KH-2026-00038", storeId: "s7", store: "Makro Phnom Penh 1", country: "KH", storeType: "Hypermarket", submitter: "Sok Vannak", expenseType: "Maintenance", subcategory: "Minor Repairs", amount: 125, currency: "KHR", status: "On Hold", submittedAt: "2026-03-06T07:30:00", receiptDate: "2026-03-04", vendor: "PP Fix It Services", notes: "Freezer door hinge replacement", ocrConfidence: 72, hasAlert: true, paymentMode: "Cash" },
  { id: "c4", claimNumber: "PC-MM-2026-00021", storeId: "s9", store: "Makro Yangon Central", country: "MM", storeType: "Hypermarket", submitter: "Aung Thura", expenseType: "Transportation", subcategory: "Local Transport", amount: 85000, currency: "MMK", status: "OCR Validating", submittedAt: "2026-03-06T10:01:00", receiptDate: "2026-03-06", vendor: "City Cab Myanmar", notes: "Emergency supply pickup", ocrConfidence: 0, hasAlert: false, paymentMode: "Cash" },
  { id: "c5", claimNumber: "PC-TH-2026-00140", storeId: "s3", store: "Makro Rama 4", country: "TH", storeType: "Hypermarket", submitter: "Prasert Kittisak", expenseType: "Refreshments", subcategory: "Staff Refreshments", amount: 4200, currency: "THB", status: "Under Investigation", submittedAt: "2026-03-05T16:22:00", receiptDate: "2026-03-05", vendor: "7-Eleven", notes: "Staff meeting refreshments", ocrConfidence: 94, hasAlert: true, paymentMode: "Cash" },
  { id: "c6", claimNumber: "PC-TH-2026-00139", storeId: "s4", store: "Makro Chaengwattana", country: "TH", storeType: "Mini", submitter: "Wanida Rattana", expenseType: "Office Supplies", subcategory: "Stationery", amount: 2100, currency: "THB", status: "Settled", submittedAt: "2026-03-04T11:15:00", receiptDate: "2026-03-03", vendor: "B2S", notes: "Printer paper and toner", ocrConfidence: 98, hasAlert: false, paymentMode: "Cash" },
  { id: "c7", claimNumber: "PC-KH-2026-00037", storeId: "s8", store: "Makro Siem Reap", country: "KH", storeType: "Supermarket", submitter: "Chan Dara", expenseType: "Postage", subcategory: "Courier & Mail", amount: 45, currency: "USD", status: "Auto Approved", submittedAt: "2026-03-05T14:30:00", receiptDate: "2026-03-05", vendor: "DHL Cambodia", notes: "Document courier to HQ", ocrConfidence: 95, hasAlert: false, paymentMode: "Cash" },
  { id: "c8", claimNumber: "PC-TH-2026-00138", storeId: "s1", store: "Makro Bangkapi", country: "TH", storeType: "Hypermarket", submitter: "Somchai Prasert", expenseType: "Printing", subcategory: "Document Printing", amount: 680, currency: "THB", status: "Draft", submittedAt: "2026-03-06T10:30:00", receiptDate: "2026-03-06", vendor: "Print Plus", notes: "Price tags printing", ocrConfidence: 0, hasAlert: false, paymentMode: "Cash" },
  { id: "c9", claimNumber: "PC-MM-2026-00020", storeId: "s10", store: "Makro Mandalay", country: "MM", storeType: "Supermarket", submitter: "Myint Zaw", expenseType: "Cleaning Supplies", subcategory: "General Cleaning", amount: 52000, currency: "MMK", status: "Rejected", submittedAt: "2026-03-03T09:00:00", receiptDate: "2026-03-02", vendor: "Myanmar Clean Co", notes: "Rejected - duplicate receipt", ocrConfidence: 88, hasAlert: true, paymentMode: "Cash" },
  { id: "c10", claimNumber: "PC-TH-2026-00137", storeId: "s2", store: "Makro Sathorn", country: "TH", storeType: "Supermarket", submitter: "Napaporn Suksai", expenseType: "Office Supplies", subcategory: "Stationery", amount: 1580, currency: "THB", status: "Awaiting Audit Document", submittedAt: "2026-03-02T13:45:00", receiptDate: "2026-03-01", vendor: "OfficeMate", notes: "Audit sample selected", ocrConfidence: 97, hasAlert: false, paymentMode: "Cash" },
  { id: "c11", claimNumber: "PC-TH-2026-00136", storeId: "s5", store: "Makro Pattaya", country: "TH", storeType: "Hypermarket", submitter: "Sompong Chaiyasit", expenseType: "Maintenance", subcategory: "Minor Repairs", amount: 12500, currency: "THB", status: "Auto Approved", submittedAt: "2026-03-05T10:20:00", receiptDate: "2026-03-04", vendor: "HandyFix Pattaya", notes: "Plumbing repair in restroom", ocrConfidence: 93, hasAlert: false, paymentMode: "Cash" },
  { id: "c12", claimNumber: "PC-TH-2026-00135", storeId: "s6", store: "Makro Chiang Mai", country: "TH", storeType: "Supermarket", submitter: "Lek Worachai", expenseType: "Security", subcategory: "Security Services", amount: 4500, currency: "THB", status: "Auto Approved", submittedAt: "2026-03-04T15:00:00", receiptDate: "2026-03-04", vendor: "SecureGuard Co", notes: "Extra night security", ocrConfidence: 90, hasAlert: false, paymentMode: "Cash" },
  { id: "c13", claimNumber: "PC-KH-2026-00036", storeId: "s7", store: "Makro Phnom Penh 1", country: "KH", storeType: "Hypermarket", submitter: "Sok Vannak", expenseType: "Transportation", subcategory: "Local Transport", amount: 35, currency: "USD", status: "Submitted", submittedAt: "2026-03-06T11:00:00", receiptDate: "2026-03-06", vendor: "PassApp", notes: "Supplier visit", ocrConfidence: 0, hasAlert: false, paymentMode: "Cash" },
  { id: "c14", claimNumber: "PC-MM-2026-00019", storeId: "s9", store: "Makro Yangon Central", country: "MM", storeType: "Hypermarket", submitter: "Aung Thura", expenseType: "Utilities", subcategory: "Minor Utilities", amount: 120000, currency: "MMK", status: "Auto Approved with Alert", submittedAt: "2026-03-04T09:30:00", receiptDate: "2026-03-03", vendor: "YESB", notes: "Generator fuel", ocrConfidence: 85, hasAlert: true, paymentMode: "Cash" },
  { id: "c15", claimNumber: "PC-TH-2026-00134", storeId: "s3", store: "Makro Rama 4", country: "TH", storeType: "Hypermarket", submitter: "Prasert Kittisak", expenseType: "Entertainment", subcategory: "Business Entertainment", amount: 3800, currency: "THB", status: "Auto Approved", submittedAt: "2026-03-03T17:45:00", receiptDate: "2026-03-03", vendor: "MK Restaurant", notes: "Supplier meeting dinner", ocrConfidence: 96, hasAlert: false, paymentMode: "Cash" },
  { id: "c16", claimNumber: "PC-TH-2026-00133", storeId: "s1", store: "Makro Bangkapi", country: "TH", storeType: "Hypermarket", submitter: "Kwanchai Maneerat", expenseType: "Cleaning Supplies", subcategory: "General Cleaning", amount: 6200, currency: "THB", status: "Settled", submittedAt: "2026-03-02T08:30:00", receiptDate: "2026-03-01", vendor: "CleanPro Thailand", notes: "Floor cleaning chemicals", ocrConfidence: 97, hasAlert: false, paymentMode: "Cash" },
  { id: "c17", claimNumber: "PC-KH-2026-00035", storeId: "s8", store: "Makro Siem Reap", country: "KH", storeType: "Supermarket", submitter: "Chan Dara", expenseType: "Refreshments", subcategory: "Staff Refreshments", amount: 28, currency: "USD", status: "Auto Approved", submittedAt: "2026-03-03T12:15:00", receiptDate: "2026-03-03", vendor: "Lucky Mart", notes: "Water and snacks for staff", ocrConfidence: 92, hasAlert: false, paymentMode: "Cash" },
  { id: "c18", claimNumber: "PC-TH-2026-00132", storeId: "s5", store: "Makro Pattaya", country: "TH", storeType: "Hypermarket", submitter: "Sompong Chaiyasit", expenseType: "Office Supplies", subcategory: "Stationery", amount: 890, currency: "THB", status: "Auto Approved", submittedAt: "2026-03-02T14:00:00", receiptDate: "2026-03-02", vendor: "OfficeMate", notes: "Label printer ribbons", ocrConfidence: 99, hasAlert: false, paymentMode: "Cash" },
  { id: "c19", claimNumber: "PC-MM-2026-00018", storeId: "s10", store: "Makro Mandalay", country: "MM", storeType: "Supermarket", submitter: "Myint Zaw", expenseType: "Postage", subcategory: "Courier & Mail", amount: 15000, currency: "MMK", status: "Auto Approved", submittedAt: "2026-03-01T10:00:00", receiptDate: "2026-03-01", vendor: "KBZ Express", notes: "Document delivery to Yangon", ocrConfidence: 91, hasAlert: false, paymentMode: "Cash" },
  { id: "c20", claimNumber: "PC-TH-2026-00131", storeId: "s4", store: "Makro Chaengwattana", country: "TH", storeType: "Mini", submitter: "Wanida Rattana", expenseType: "Transportation", subcategory: "Local Transport", amount: 450, currency: "THB", status: "Settled", submittedAt: "2026-03-01T16:30:00", receiptDate: "2026-03-01", vendor: "Grab", notes: "Bank deposit run", ocrConfidence: 94, hasAlert: false, paymentMode: "Cash" },
];

// --- Advances ---

export const advances: Advance[] = [
  { id: "a1", advanceNumber: "ADV-TH-2026-0042", storeId: "s1", store: "Makro Bangkapi", country: "TH", recipient: "Somchai Prasert", purpose: "Emergency plumbing repair", amount: 15000, currency: "THB", issuedDate: "2026-02-28", dueDate: "2026-03-14", settledAmount: 12500, returnedCash: 0, status: "Partially Settled", daysOutstanding: 6 },
  { id: "a2", advanceNumber: "ADV-TH-2026-0041", storeId: "s3", store: "Makro Rama 4", country: "TH", recipient: "Prasert Kittisak", purpose: "Store event supplies", amount: 8000, currency: "THB", issuedDate: "2026-02-20", dueDate: "2026-03-06", settledAmount: 0, returnedCash: 0, status: "Overdue", daysOutstanding: 14 },
  { id: "a3", advanceNumber: "ADV-KH-2026-0008", storeId: "s7", store: "Makro Phnom Penh 1", country: "KH", recipient: "Sok Vannak", purpose: "Repair contractor payment", amount: 350, currency: "USD", issuedDate: "2026-03-01", dueDate: "2026-03-15", settledAmount: 0, returnedCash: 0, status: "Open", daysOutstanding: 5 },
  { id: "a4", advanceNumber: "ADV-TH-2026-0040", storeId: "s5", store: "Makro Pattaya", country: "TH", recipient: "Sompong Chaiyasit", purpose: "Transport rental", amount: 5000, currency: "THB", issuedDate: "2026-03-03", dueDate: "2026-03-17", settledAmount: 5000, returnedCash: 0, status: "Settled", daysOutstanding: 0 },
  { id: "a5", advanceNumber: "ADV-MM-2026-0005", storeId: "s9", store: "Makro Yangon Central", country: "MM", recipient: "Aung Thura", purpose: "Generator maintenance", amount: 500000, currency: "MMK", issuedDate: "2026-02-25", dueDate: "2026-03-11", settledAmount: 450000, returnedCash: 50000, status: "Settled", daysOutstanding: 0 },
  { id: "a6", advanceNumber: "ADV-TH-2026-0039", storeId: "s2", store: "Makro Sathorn", country: "TH", recipient: "Napaporn Suksai", purpose: "Safety equipment", amount: 6000, currency: "THB", issuedDate: "2026-02-15", dueDate: "2026-03-01", settledAmount: 0, returnedCash: 0, status: "Overdue", daysOutstanding: 19 },
  { id: "a7", advanceNumber: "ADV-TH-2026-0038", storeId: "s6", store: "Makro Chiang Mai", country: "TH", recipient: "Lek Worachai", purpose: "Pest control service", amount: 4000, currency: "THB", issuedDate: "2026-03-04", dueDate: "2026-03-18", settledAmount: 0, returnedCash: 0, status: "Open", daysOutstanding: 2 },
  { id: "a8", advanceNumber: "ADV-KH-2026-0007", storeId: "s8", store: "Makro Siem Reap", country: "KH", recipient: "Chan Dara", purpose: "Equipment rental", amount: 200, currency: "USD", issuedDate: "2026-03-05", dueDate: "2026-03-19", settledAmount: 0, returnedCash: 0, status: "Open", daysOutstanding: 1 },
];

// --- Cashbook (sample for Makro Bangkapi) ---

export const cashbookEntries: CashbookEntry[] = [
  { id: "cb1", date: "2026-03-01", type: "Opening Balance", reference: "OB-2026-03", description: "March opening balance", debit: 50000, credit: 0, runningBalance: 50000 },
  { id: "cb2", date: "2026-03-01", type: "Claim Payout", reference: "PC-TH-2026-00131", description: "Transportation - Wanida R.", debit: 0, credit: 450, runningBalance: 49550 },
  { id: "cb3", date: "2026-03-02", type: "Claim Payout", reference: "PC-TH-2026-00132", description: "Office Supplies - Sompong C.", debit: 0, credit: 890, runningBalance: 48660 },
  { id: "cb4", date: "2026-03-02", type: "Claim Payout", reference: "PC-TH-2026-00133", description: "Cleaning Supplies - Kwanchai M.", debit: 0, credit: 6200, runningBalance: 42460 },
  { id: "cb5", date: "2026-03-03", type: "Advance Issue", reference: "ADV-TH-2026-0042", description: "Advance - Somchai P. - Plumbing", debit: 0, credit: 15000, runningBalance: 27460 },
  { id: "cb6", date: "2026-03-04", type: "Settlement Return", reference: "ADV-TH-2026-0042", description: "Partial settlement return", debit: 2500, credit: 0, runningBalance: 29960 },
  { id: "cb7", date: "2026-03-04", type: "Claim Payout", reference: "PC-TH-2026-00139", description: "Office Supplies - Wanida R.", debit: 0, credit: 2100, runningBalance: 27860 },
  { id: "cb8", date: "2026-03-05", type: "Replenishment", reference: "REP-TH-2026-0015", description: "Cash replenishment from HO", debit: 20000, credit: 0, runningBalance: 47860 },
  { id: "cb9", date: "2026-03-05", type: "Claim Payout", reference: "PC-TH-2026-00136", description: "Maintenance - Sompong C.", debit: 0, credit: 12500, runningBalance: 35360 },
  { id: "cb10", date: "2026-03-05", type: "Claim Payout", reference: "PC-TH-2026-00142", description: "Office Supplies - Somchai P.", debit: 0, credit: 1250, runningBalance: 34110 },
  { id: "cb11", date: "2026-03-06", type: "Claim Payout", reference: "PC-TH-2026-00138", description: "Printing - Somchai P.", debit: 0, credit: 680, runningBalance: 33430 },
  { id: "cb12", date: "2026-03-06", type: "Cash Count", reference: "CC-2026-03-06", description: "End of day cash count", debit: 0, credit: 0, runningBalance: 33430 },
];

// --- Alerts ---

export const alerts: AlertRecord[] = [
  { id: "al1", type: "anomaly", severity: "critical", title: "Cleaning spend 340% above peer average", description: "Makro Sathorn cleaning supplies spending is significantly higher than peer Supermarket stores. Monthly total ฿8,500 vs peer avg ฿2,500.", storeId: "s2", store: "Makro Sathorn", country: "TH", storeType: "Supermarket", expenseCategory: "Cleaning Supplies", amountDeviation: 240, peerBenchmark: 2500, actualAmount: 8500, yoyChange: 180, assignedTo: "Thanyarat C.", status: "Open", createdAt: "2026-03-06T08:50:00", linkedClaimId: "c2", reasonCodes: ["PEER_ANOMALY", "YOY_SPIKE"], notes: ["Auto-flagged by system"] },
  { id: "al2", type: "duplicate", severity: "critical", title: "Possible duplicate receipt detected", description: "Receipt from PP Fix It Services matches a previous submission from February with similar amount and vendor.", storeId: "s7", store: "Makro Phnom Penh 1", country: "KH", storeType: "Hypermarket", expenseCategory: "Maintenance", amountDeviation: 0, peerBenchmark: 100, actualAmount: 125, yoyChange: 0, assignedTo: "Mony K.", status: "In Progress", createdAt: "2026-03-06T07:35:00", linkedClaimId: "c3", reasonCodes: ["DUPLICATE_RECEIPT"], notes: ["Investigating vendor invoice numbers", "Requested original from store"] },
  { id: "al3", type: "limit_breach", severity: "high", title: "Refreshments exceed hard-stop limit", description: "Single refreshment claim of ฿4,200 exceeds the hard-stop threshold of ฿3,000.", storeId: "s3", store: "Makro Rama 4", country: "TH", storeType: "Hypermarket", expenseCategory: "Refreshments", amountDeviation: 40, peerBenchmark: 1200, actualAmount: 4200, yoyChange: 250, assignedTo: "Thanyarat C.", status: "Open", createdAt: "2026-03-05T16:25:00", linkedClaimId: "c5", reasonCodes: ["HARD_STOP_LIMIT", "YOY_SPIKE"], notes: [] },
  { id: "al4", type: "anomaly", severity: "medium", title: "Transportation spike vs last year", description: "Myanmar store transportation costs 180% higher than same period last year.", storeId: "s9", store: "Makro Yangon Central", country: "MM", storeType: "Hypermarket", expenseCategory: "Transportation", amountDeviation: 80, peerBenchmark: 45000, actualAmount: 85000, yoyChange: 80, assignedTo: "Zaw M.", status: "Open", createdAt: "2026-03-06T10:05:00", linkedClaimId: "c4", reasonCodes: ["YOY_SPIKE"], notes: [] },
  { id: "al5", type: "anomaly", severity: "medium", title: "Generator fuel cost unusually high", description: "Utility expense flagged as 200% above normal monthly average.", storeId: "s9", store: "Makro Yangon Central", country: "MM", storeType: "Hypermarket", expenseCategory: "Utilities", amountDeviation: 100, peerBenchmark: 60000, actualAmount: 120000, yoyChange: 95, assignedTo: "Zaw M.", status: "Open", createdAt: "2026-03-04T09:35:00", linkedClaimId: "c14", reasonCodes: ["PEER_ANOMALY", "YOY_SPIKE"], notes: [] },
  { id: "al6", type: "duplicate", severity: "high", title: "Duplicate vendor invoice suspected", description: "Makro Mandalay cleaning supplies receipt hash matches previous month submission.", storeId: "s10", store: "Makro Mandalay", country: "MM", storeType: "Supermarket", expenseCategory: "Cleaning Supplies", amountDeviation: 0, peerBenchmark: 40000, actualAmount: 52000, yoyChange: 30, assignedTo: "Zaw M.", status: "Closed", createdAt: "2026-03-03T09:05:00", linkedClaimId: "c9", reasonCodes: ["DUPLICATE_RECEIPT"], notes: ["Confirmed duplicate - claim rejected"] },
  { id: "al7", type: "anomaly", severity: "low", title: "Postage costs trending up", description: "Siem Reap postage spend 130% of peer average for Supermarket stores.", storeId: "s8", store: "Makro Siem Reap", country: "KH", storeType: "Supermarket", expenseCategory: "Postage", amountDeviation: 30, peerBenchmark: 35, actualAmount: 45, yoyChange: 25, assignedTo: "Mony K.", status: "Closed", createdAt: "2026-03-05T14:35:00", linkedClaimId: "c7", reasonCodes: ["PEER_ANOMALY"], notes: ["Reviewed - justified by document volume increase"] },
  { id: "al8", type: "limit_breach", severity: "high", title: "Store below minimum petty cash fund balance", description: "Makro Sathorn current balance ฿6,200 is approaching the minimum threshold of ฿5,000.", storeId: "s2", store: "Makro Sathorn", country: "TH", storeType: "Supermarket", expenseCategory: "N/A", amountDeviation: 0, peerBenchmark: 0, actualAmount: 6200, yoyChange: 0, assignedTo: "Thanyarat C.", status: "Open", createdAt: "2026-03-06T06:00:00", reasonCodes: ["LOW_BALANCE"], notes: ["Replenishment request pending"] },
];

// --- Investigations ---

export const investigations: Investigation[] = [
  { id: "inv1", caseNumber: "INV-TH-2026-0012", title: "Abnormal refreshment spending pattern", store: "Makro Rama 4", country: "TH", status: "In Progress", severity: "high", owner: "Thanyarat Chaisamut", createdAt: "2026-03-05", daysOpen: 1, linkedAlertIds: ["al3"], linkedClaimIds: ["c5"], evidenceChecklist: [{ item: "Receipt images verified", completed: true }, { item: "Vendor cross-check", completed: false }, { item: "Store manager interview", completed: false }, { item: "Peer comparison report", completed: true }], notes: [{ author: "Thanyarat C.", date: "2026-03-05", text: "Claim amount exceeds hard-stop. Submitter has 3 similar claims in past 30 days." }, { author: "System", date: "2026-03-05", text: "Auto-escalated due to hard-stop breach." }], category: "Refreshments", totalAmount: 4200, currency: "THB" },
  { id: "inv2", caseNumber: "INV-KH-2026-0003", title: "Duplicate receipt investigation", store: "Makro Phnom Penh 1", country: "KH", status: "Pending Evidence", severity: "critical", owner: "Mony Keo", createdAt: "2026-03-06", daysOpen: 0, linkedAlertIds: ["al2"], linkedClaimIds: ["c3"], evidenceChecklist: [{ item: "OCR hash comparison", completed: true }, { item: "Original receipt requested", completed: true }, { item: "Vendor confirmation", completed: false }, { item: "Previous claim review", completed: true }], notes: [{ author: "Mony K.", date: "2026-03-06", text: "Original receipt requested from store. OCR hash shows 94% similarity with Feb claim." }], category: "Maintenance", totalAmount: 125, currency: "USD" },
  { id: "inv3", caseNumber: "INV-TH-2026-0011", title: "Cleaning supplies overspend pattern", store: "Makro Sathorn", country: "TH", status: "Open", severity: "high", owner: "Thanyarat Chaisamut", createdAt: "2026-03-06", daysOpen: 0, linkedAlertIds: ["al1"], linkedClaimIds: ["c2"], evidenceChecklist: [{ item: "3-month trend analysis", completed: false }, { item: "Vendor verification", completed: false }, { item: "Peer store comparison", completed: true }, { item: "Store manager statement", completed: false }], notes: [{ author: "System", date: "2026-03-06", text: "Auto-created from alert AL1. Spending 340% above peer average." }], category: "Cleaning Supplies", totalAmount: 8500, currency: "THB" },
  { id: "inv4", caseNumber: "INV-MM-2026-0002", title: "Utility cost anomaly", store: "Makro Yangon Central", country: "MM", status: "Open", severity: "medium", owner: "Zaw Myint", createdAt: "2026-03-04", daysOpen: 2, linkedAlertIds: ["al5"], linkedClaimIds: ["c14"], evidenceChecklist: [{ item: "Fuel price verification", completed: true }, { item: "Generator usage log", completed: false }, { item: "Utility bill comparison", completed: false }], notes: [{ author: "Zaw M.", date: "2026-03-04", text: "Checking if there were extended power outages requiring generator use." }], category: "Utilities", totalAmount: 120000, currency: "MMK" },
  { id: "inv5", caseNumber: "INV-TH-2026-0010", title: "Advance overdue - safety equipment", store: "Makro Sathorn", country: "TH", status: "Escalated", severity: "high", owner: "Thanyarat Chaisamut", createdAt: "2026-02-28", daysOpen: 6, linkedAlertIds: [], linkedClaimIds: [], evidenceChecklist: [{ item: "Advance recipient contacted", completed: true }, { item: "Purchase evidence requested", completed: true }, { item: "Manager approval verified", completed: true }, { item: "Settlement deadline extended", completed: false }], notes: [{ author: "Thanyarat C.", date: "2026-02-28", text: "Advance of ฿6,000 overdue by 5 days. Recipient contacted." }, { author: "Thanyarat C.", date: "2026-03-03", text: "Recipient claims equipment not yet delivered. Escalating to country finance." }], category: "Advance", totalAmount: 6000, currency: "THB" },
];

// --- Audit Requests ---

export const auditRequests: AuditRequest[] = [
  { id: "aud1", auditNumber: "AUD-TH-2026-0018", claimId: "c10", claimNumber: "PC-TH-2026-00137", store: "Makro Sathorn", country: "TH", requestedDate: "2026-03-02", requestedFrom: "Napaporn Suksai", status: "Requested", findingSeverity: undefined, findingSummary: undefined },
  { id: "aud2", auditNumber: "AUD-KH-2026-0004", claimId: "c3", claimNumber: "PC-KH-2026-00038", store: "Makro Phnom Penh 1", country: "KH", requestedDate: "2026-03-06", requestedFrom: "Sok Vannak", status: "Requested", findingSeverity: undefined, findingSummary: undefined },
  { id: "aud3", auditNumber: "AUD-TH-2026-0017", claimId: "c16", claimNumber: "PC-TH-2026-00133", store: "Makro Bangkapi", country: "TH", requestedDate: "2026-02-25", requestedFrom: "Kwanchai Maneerat", status: "Completed", receivedDate: "2026-02-28", reviewedDate: "2026-03-01", findingSeverity: "None", findingSummary: "All documents match. No issues found." },
  { id: "aud4", auditNumber: "AUD-TH-2026-0016", claimId: "c6", claimNumber: "PC-TH-2026-00139", store: "Makro Chaengwattana", country: "TH", requestedDate: "2026-02-20", requestedFrom: "Wanida Rattana", status: "Under Review", receivedDate: "2026-02-24", findingSeverity: undefined, findingSummary: undefined },
  { id: "aud5", auditNumber: "AUD-MM-2026-0002", claimId: "c9", claimNumber: "PC-MM-2026-00020", store: "Makro Mandalay", country: "MM", requestedDate: "2026-03-03", requestedFrom: "Myint Zaw", status: "Received", receivedDate: "2026-03-05", findingSeverity: undefined, findingSummary: undefined },
];

// --- Chart Data ---

export const monthlySpendData = [
  { month: "Oct", thisYear: 185000, lastYear: 165000 },
  { month: "Nov", thisYear: 210000, lastYear: 175000 },
  { month: "Dec", thisYear: 245000, lastYear: 195000 },
  { month: "Jan", thisYear: 198000, lastYear: 180000 },
  { month: "Feb", thisYear: 220000, lastYear: 190000 },
  { month: "Mar", thisYear: 142000, lastYear: 172000 },
];

export const spendByCategory = [
  { category: "Office Supplies", amount: 42500, fill: "hsl(var(--chart-1))" },
  { category: "Cleaning", amount: 38200, fill: "hsl(var(--chart-2))" },
  { category: "Maintenance", amount: 35800, fill: "hsl(var(--chart-3))" },
  { category: "Transportation", amount: 18500, fill: "hsl(var(--chart-4))" },
  { category: "Refreshments", amount: 12400, fill: "hsl(var(--chart-5))" },
  { category: "Others", amount: 9600, fill: "hsl(var(--chart-6))" },
];

export const storeBenchmarkData = [
  { store: "Bangkapi", actual: 48000, benchmark: 45000, type: "Hypermarket" },
  { store: "Sathorn", actual: 32000, benchmark: 22000, type: "Supermarket" },
  { store: "Rama 4", actual: 41000, benchmark: 45000, type: "Hypermarket" },
  { store: "Chaengwattana", actual: 8500, benchmark: 10000, type: "Mini" },
  { store: "Pattaya", actual: 44000, benchmark: 45000, type: "Hypermarket" },
  { store: "Chiang Mai", actual: 19000, benchmark: 22000, type: "Supermarket" },
];

export const advanceAgingData = [
  { range: "0-7 days", count: 3 },
  { range: "8-14 days", count: 1 },
  { range: "15-30 days", count: 1 },
  { range: "30+ days", count: 0 },
];

// --- Dashboard Metrics ---

export const getDashboardMetrics = (country: string) => {
  const filteredClaims = country === "all" ? claims : claims.filter(c => c.country === country);
  const filteredStores = country === "all" ? stores : stores.filter(s => s.country === country);
  const filteredAlerts = country === "all" ? alerts : alerts.filter(a => a.country === country);
  const filteredAdvances = country === "all" ? advances : advances.filter(a => a.country === country);

  const todayClaims = filteredClaims.filter(c => c.submittedAt.startsWith("2026-03-06")).length;
  const autoApproved = filteredClaims.filter(c => c.status === "Auto Approved" || c.status === "Auto Approved with Alert").length;
  const onHold = filteredClaims.filter(c => c.status === "On Hold" || c.status === "Under Investigation").length;
  const openAlerts = filteredAlerts.filter(a => a.status === "Open" || a.status === "In Progress").length;
  const overdueAdvances = filteredAdvances.filter(a => a.status === "Overdue").length;
  const lowBalanceStores = filteredStores.filter(s => s.currentBalance <= s.minBalance * 1.2).length;

  return {
    todayClaims,
    autoApprovedRate: filteredClaims.length > 0 ? Math.round((autoApproved / filteredClaims.length) * 100) : 0,
    onHold,
    openAlerts,
    overdueAdvances,
    lowBalanceStores,
    totalFloat: filteredStores.reduce((sum, s) => sum + s.currentBalance, 0),
  };
};

// --- Activity Feed ---
export const recentActivity = [
  { time: "10:30", action: "Claim PC-TH-2026-00138 saved as draft", user: "Somchai P.", type: "claim" as const },
  { time: "10:01", action: "Claim PC-MM-2026-00021 submitted for OCR", user: "Aung T.", type: "claim" as const },
  { time: "09:12", action: "Claim PC-TH-2026-00142 auto-approved", user: "System", type: "approval" as const },
  { time: "08:50", action: "Alert: Cleaning spend anomaly at Sathorn", user: "System", type: "alert" as const },
  { time: "08:45", action: "Claim PC-TH-2026-00141 approved with alert", user: "System", type: "approval" as const },
  { time: "07:35", action: "Duplicate receipt detected at Phnom Penh 1", user: "System", type: "alert" as const },
  { time: "07:30", action: "Claim PC-KH-2026-00038 put on hold", user: "System", type: "hold" as const },
  { time: "06:00", action: "Low balance alert for Makro Sathorn", user: "System", type: "alert" as const },
];
