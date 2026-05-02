export type ClaimStatus =
  | "Draft"
  | "Pending"
  | "Approved"
  | "Approved with Alert"
  | "On Hold"
  | "Rejected"
  | "Settled";

export type OcrStatus = "confirmed" | "low_confidence" | "na" | "processing";

export interface MockClaim {
  claim_no: string;
  store_id: string;
  store_name: string;
  region_id: string;
  /** user_id of the submitter — used by scope service `self` filter. */
  submitted_by: string;
  submitter_name: string;
  expense_type: string;
  amount: number;
  status: ClaimStatus;
  ocr_status: OcrStatus;
  transaction_date: string; // YYYY-MM-DD
  alert: { type: string; message: string } | null;
}

// Submitter name → user_id (matches mockUsers in src/lib/roles.ts where possible).
// Names not in mockUsers get a stable synthetic id so `self` scope is deterministic.
const U = {
  somchai: "u2",          // Somchai Prathumwan
  priya: "u4",
  chan: "u7",
  aung_myint: "u8",
  // Synthetic
  aung_thant: "e-aung-thant",
  thanyarat_l: "e-thanyarat-l",
  mony: "e-mony-saetan",
  pattana: "e-pattana-k",
  niran: "e-niran-b",
  chai_r: "e-chai-r",
  pim: "e-pim-k",
} as const;

export const MOCK_CLAIMS: MockClaim[] = [
  { claim_no: "PC-TH-00003-2026-05-00012", store_id: "s3", store_name: "Makro Rama 4", region_id: "r-bkk", submitted_by: U.somchai, submitter_name: "Somchai Prathumwan", expense_type: "Taxi / Grab", amount: 280, status: "Draft", ocr_status: "na", transaction_date: "2026-05-02", alert: null },
  { claim_no: "PC-TH-00003-2026-05-00013", store_id: "s3", store_name: "Makro Rama 4", region_id: "r-bkk", submitted_by: U.somchai, submitter_name: "Somchai Prathumwan", expense_type: "Accommodation Hotel — Domestic", amount: 4800, status: "Draft", ocr_status: "na", transaction_date: "2026-05-02", alert: null },
  { claim_no: "PC-TH-00001-2026-05-00009", store_id: "s1", store_name: "Makro Bangkapi", region_id: "r-bkk", submitted_by: U.aung_thant, submitter_name: "Aung Thant", expense_type: "Courier / Postage", amount: 350, status: "Draft", ocr_status: "na", transaction_date: "2026-05-02", alert: null },
  { claim_no: "PC-TH-00002-2026-05-00007", store_id: "s2", store_name: "Makro Sathorn", region_id: "r-bkk", submitted_by: U.thanyarat_l, submitter_name: "Thanyarat L.", expense_type: "Toll Fees", amount: 120, status: "Pending", ocr_status: "confirmed", transaction_date: "2026-05-01", alert: null },
  { claim_no: "PC-TH-00003-2026-05-00010", store_id: "s3", store_name: "Makro Rama 4", region_id: "r-bkk", submitted_by: U.mony, submitter_name: "Mony Saetan", expense_type: "Airline — Domestic", amount: 5500, status: "Pending", ocr_status: "confirmed", transaction_date: "2026-05-01", alert: null },
  { claim_no: "PC-TH-00006-2026-05-00004", store_id: "s6", store_name: "Makro Chiang Mai", region_id: "r-north", submitted_by: U.pattana, submitter_name: "Pattana K.", expense_type: "Per Diem — Domestic", amount: 600, status: "Pending", ocr_status: "na", transaction_date: "2026-04-30", alert: null },
  { claim_no: "PC-TH-00004-2026-05-00006", store_id: "s4", store_name: "Makro Chaengwattana", region_id: "r-bkk", submitted_by: U.niran, submitter_name: "Niran B.", expense_type: "Funeral — Wreath", amount: 2000, status: "Pending", ocr_status: "confirmed", transaction_date: "2026-04-30", alert: null },
  { claim_no: "PC-TH-00003-2026-05-00008", store_id: "s3", store_name: "Makro Rama 4", region_id: "r-bkk", submitted_by: U.somchai, submitter_name: "Somchai Prathumwan", expense_type: "Taxi / Grab", amount: 250, status: "Approved", ocr_status: "confirmed", transaction_date: "2026-05-01", alert: null },
  { claim_no: "PC-TH-00005-2026-05-00005", store_id: "s5", store_name: "Makro Pattaya", region_id: "r-east", submitted_by: U.chai_r, submitter_name: "Chai R.", expense_type: "Toll Fees", amount: 80, status: "Approved", ocr_status: "confirmed", transaction_date: "2026-05-01", alert: null },
  { claim_no: "PC-TH-00002-2026-05-00006", store_id: "s2", store_name: "Makro Sathorn", region_id: "r-bkk", submitted_by: U.thanyarat_l, submitter_name: "Thanyarat L.", expense_type: "Courier / Postage", amount: 280, status: "Approved", ocr_status: "confirmed", transaction_date: "2026-04-30", alert: null },
  { claim_no: "PC-TH-00001-2026-05-00007", store_id: "s1", store_name: "Makro Bangkapi", region_id: "r-bkk", submitted_by: U.aung_thant, submitter_name: "Aung Thant", expense_type: "Train / Inter-city Bus", amount: 450, status: "Approved", ocr_status: "confirmed", transaction_date: "2026-04-30", alert: null },
  { claim_no: "PC-TH-00006-2026-05-00003", store_id: "s6", store_name: "Makro Chiang Mai", region_id: "r-north", submitted_by: U.pattana, submitter_name: "Pattana K.", expense_type: "Government License / Permit", amount: 1200, status: "Approved", ocr_status: "confirmed", transaction_date: "2026-04-29", alert: null },
  { claim_no: "PC-TH-00003-2026-04-00045", store_id: "s3", store_name: "Makro Rama 4", region_id: "r-bkk", submitted_by: U.mony, submitter_name: "Mony Saetan", expense_type: "Accommodation Hotel — Domestic", amount: 3800, status: "Approved", ocr_status: "confirmed", transaction_date: "2026-04-28", alert: null },
  { claim_no: "PC-TH-00002-2026-05-00005", store_id: "s2", store_name: "Makro Sathorn", region_id: "r-bkk", submitted_by: U.pim, submitter_name: "Pim K.", expense_type: "Meal Restaurant — Business Meal", amount: 1650, status: "Approved with Alert", ocr_status: "confirmed", transaction_date: "2026-05-01", alert: { type: "soft_threshold", message: "Amount above peer average" } },
  { claim_no: "PC-TH-00003-2026-05-00007", store_id: "s3", store_name: "Makro Rama 4", region_id: "r-bkk", submitted_by: U.somchai, submitter_name: "Somchai Prathumwan", expense_type: "Client Entertainment", amount: 4200, status: "Approved with Alert", ocr_status: "confirmed", transaction_date: "2026-04-30", alert: { type: "near_threshold", message: "Amount near approval threshold" } },
  { claim_no: "PC-TH-00006-2026-04-00018", store_id: "s6", store_name: "Makro Chiang Mai", region_id: "r-north", submitted_by: U.pattana, submitter_name: "Pattana K.", expense_type: "Personal Car — Mileage", amount: 2400, status: "Approved with Alert", ocr_status: "low_confidence", transaction_date: "2026-04-28", alert: { type: "ocr_low_confidence", message: "License plate unclear in receipt" } },
  { claim_no: "PC-TH-00002-2026-04-00038", store_id: "s2", store_name: "Makro Sathorn", region_id: "r-bkk", submitted_by: U.thanyarat_l, submitter_name: "Thanyarat L.", expense_type: "Meal Restaurant — Business Meal", amount: 1200, status: "On Hold", ocr_status: "confirmed", transaction_date: "2026-04-28", alert: { type: "duplicate_suspected", message: "Possible duplicate of PC-TH-00002-2026-04-00037" } },
  { claim_no: "PC-TH-00003-2026-04-00037", store_id: "s3", store_name: "Makro Rama 4", region_id: "r-bkk", submitted_by: U.mony, submitter_name: "Mony Saetan", expense_type: "Wet Waste Disposal", amount: 3500, status: "On Hold", ocr_status: "low_confidence", transaction_date: "2026-04-27", alert: { type: "handwritten", message: "Handwritten document — manual review needed" } },
  { claim_no: "PC-TH-00003-2026-04-00041", store_id: "s3", store_name: "Makro Rama 4", region_id: "r-bkk", submitted_by: U.somchai, submitter_name: "Somchai Prathumwan", expense_type: "Funeral — Wreath", amount: 2500, status: "Rejected", ocr_status: "confirmed", transaction_date: "2026-04-25", alert: { type: "cap_exceeded", message: "Exceeds 2,000 THB cap for wreath" } },
  { claim_no: "PC-TH-00001-2026-04-00033", store_id: "s1", store_name: "Makro Bangkapi", region_id: "r-bkk", submitted_by: U.aung_thant, submitter_name: "Aung Thant", expense_type: "Taxi / Grab", amount: 320, status: "Rejected", ocr_status: "confirmed", transaction_date: "2026-04-24", alert: { type: "stale_date", message: "Receipt date older than 90-day window" } },
  { claim_no: "PC-TH-00003-2026-04-00040", store_id: "s3", store_name: "Makro Rama 4", region_id: "r-bkk", submitted_by: U.mony, submitter_name: "Mony Saetan", expense_type: "Per Diem — Domestic (Advance)", amount: 800, status: "Settled", ocr_status: "confirmed", transaction_date: "2026-04-26", alert: null },
  { claim_no: "PC-TH-00006-2026-04-00022", store_id: "s6", store_name: "Makro Chiang Mai", region_id: "r-north", submitted_by: U.pattana, submitter_name: "Pattana K.", expense_type: "Hotel + Per Diem (Advance)", amount: 6200, status: "Settled", ocr_status: "confirmed", transaction_date: "2026-04-22", alert: null },
  { claim_no: "PC-TH-00002-2026-04-00018", store_id: "s2", store_name: "Makro Sathorn", region_id: "r-bkk", submitted_by: U.thanyarat_l, submitter_name: "Thanyarat L.", expense_type: "Airline + Hotel (Advance)", amount: 8500, status: "Settled", ocr_status: "confirmed", transaction_date: "2026-04-18", alert: null },
];

export const STATUS_TABS: { label: "All" | ClaimStatus }[] = [
  { label: "All" },
  { label: "Draft" },
  { label: "Pending" },
  { label: "Approved" },
  { label: "Approved with Alert" },
  { label: "On Hold" },
  { label: "Rejected" },
  { label: "Settled" },
];
