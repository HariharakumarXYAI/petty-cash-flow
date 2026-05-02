// Config-driven document requirements per sub-expense type.
// Mirrors the Finance master file. Keyed by sub_type_id (matches expenseTypes.id
// and SUB_EXPENSE_TYPES[].id). Drives the Required Documents UI on /claims/new.
//
// Slot types:
//   - "required":            single mandatory slot (file or structured input)
//   - "required_one_of":     one slot with N options shown as tabs; one upload satisfies all
//   - "optional":            non-blocking optional file
//   - "conditional_required": Yes/No question; if Yes, behaves like "required"
//   - "conditional_optional": Yes/No question; if Yes, behaves like "optional"

export type DocSlotType =
  | "required"
  | "required_one_of"
  | "optional"
  | "conditional_required"
  | "conditional_optional";

export type DocInputType = "file" | "free_text" | "structured_form" | "select" | "number" | "list";

export interface StructuredField {
  id: string;
  label_en: string;
  label_th: string;
  input_type: DocInputType;
}

export interface DocSlotOption {
  id: string;
  label_en: string;
  label_th: string;
  hint_en?: string;
}

export interface DocSlotCap {
  max_amount?: number;
  currency?: string;
  max_days?: number;
  max_hours?: number;
}

export interface DocSlot {
  type: DocSlotType;
  id: string;
  label_en: string;
  label_th: string;
  hint_en?: string;
  // For required_one_of
  options?: DocSlotOption[];
  // Conditional question
  condition?: string;
  approver_level?: string;
  approver_level_options?: string[];
  additional_approver?: string;
  // Input-style overrides for required slots
  input_type?: DocInputType;
  // For input_type "select" — the options
  options_select?: string[];
  // For structured_form
  structured_fields?: StructuredField[];
  // OCR-side validation hint (e.g. "must_show_license_plate")
  ocr_validation?: string;
  // Caps shown as a hint line under the slot
  cap?: DocSlotCap;
}

export const DOC_REQUIREMENTS: Record<string, DocSlot[]> = {
  // Taxi / Grab → lt-taxi
  "lt-taxi": [
    {
      type: "required_one_of",
      id: "ticket_or_form",
      label_en: "Receipt or Claim Form",
      label_th: "ใบเสร็จ หรือ แบบฟอร์มเบิก",
      options: [
        { id: "receipt", label_en: "Receipt", label_th: "ใบเสร็จรับเงิน" },
        { id: "claim_form", label_en: "Travelling Expenses Claim Form", label_th: "แบบฟอร์มเบิกค่าเดินทาง", hint_en: "Use if no receipt available" },
      ],
    },
    {
      type: "conditional_optional",
      id: "memo_threshold",
      label_en: "Memo / Business Purpose",
      label_th: "บันทึก / วัตถุประสงค์ทางธุรกิจ",
      condition: "amount_exceeds_threshold",
      hint_en: "Required when amount exceeds threshold",
    },
  ],

  // Train / Inter-city Bus → lt-train
  "lt-train": [
    {
      type: "required_one_of",
      id: "ticket_or_form",
      label_en: "Train/Bus ticket or Claim Form",
      label_th: "ตั๋วรถไฟ/รถทัวร์ หรือ แบบฟอร์มเบิก",
      options: [
        { id: "ticket", label_en: "Train/Bus ticket", label_th: "ตั๋วรถไฟ / รถทัวร์" },
        { id: "claim_form", label_en: "Travelling Expenses Claim Form", label_th: "แบบฟอร์มเบิกค่าเดินทาง", hint_en: "Use if no ticket available" },
      ],
    },
  ],

  // Personal Car — Mileage → lt-car
  "lt-car": [
    {
      type: "required",
      id: "fuel_receipt",
      label_en: "Fuel receipt (must show vehicle plate)",
      label_th: "ใบเสร็จน้ำมัน (พร้อมระบุทะเบียนรถ)",
      ocr_validation: "must_show_license_plate",
    },
    {
      type: "required",
      id: "ccc_reason",
      label_en: "Reason for using CCC card instead of Fleet Card",
      label_th: "สาเหตุที่ต้องใช้บัตร CCC แทน Fleet Card บริษัท",
      input_type: "free_text",
    },
    {
      type: "required",
      id: "trip_log",
      label_en: "Trip log (origin / destination / km)",
      label_th: "รายละเอียดการเดินทาง (ต้นทาง–ปลายทาง–กิโลเมตร)",
      input_type: "structured_form",
      structured_fields: [
        { id: "from", label_en: "Origin", label_th: "ต้นทาง", input_type: "free_text" },
        { id: "to", label_en: "Destination", label_th: "ปลายทาง", input_type: "free_text" },
        { id: "km", label_en: "Distance (km)", label_th: "ระยะทาง (กม.)", input_type: "number" },
      ],
    },
  ],

  // EV Car — Mileage → lt-ev
  "lt-ev": [
    {
      type: "required",
      id: "trip_log",
      label_en: "Trip log (origin / destination / km)",
      label_th: "รายละเอียดการเดินทาง (ต้นทาง–ปลายทาง–กิโลเมตร)",
      input_type: "structured_form",
      structured_fields: [
        { id: "from", label_en: "Origin", label_th: "ต้นทาง", input_type: "free_text" },
        { id: "to", label_en: "Destination", label_th: "ปลายทาง", input_type: "free_text" },
        { id: "km", label_en: "Distance (km)", label_th: "ระยะทาง (กม.)", input_type: "number" },
      ],
    },
  ],

  // Toll Fees → lt-toll
  "lt-toll": [
    { type: "required", id: "toll_receipt", label_en: "Toll receipt or proof of payment", label_th: "ใบเสร็จค่าทางด่วน หรือเอกสารแสดงว่ามีการจ่ายค่าทางด่วน" },
  ],

  // Airport Parking → lt-airpark
  "lt-airpark": [
    {
      type: "required",
      id: "parking_receipt",
      label_en: "Parking receipt",
      label_th: "ใบเสร็จค่าจอดรถ",
      cap: { max_days: 4, max_hours: 96 },
      hint_en: "Maximum 4 days / 96 hours",
    },
  ],

  // Other Parking → lt-otherpark
  "lt-otherpark": [
    { type: "required", id: "receipt", label_en: "Receipt", label_th: "ใบเสร็จรับเงิน" },
  ],

  // Car Rental → lt-rental
  "lt-rental": [
    { type: "required", id: "rental_invoice", label_en: "Invoice or Receipt from car rental company", label_th: "Invoice หรือ Receipt จากบริษัทรถเช่า" },
    {
      type: "conditional_required",
      id: "travel_approval",
      label_en: "Travel Approval letter",
      label_th: "หนังสืออนุมัติเดินทาง",
      condition: "not_booked_via_cga",
      approver_level: "associate_director_hr",
      hint_en: "Required if not booked through CGA. Must be approved by Associate Director-HR.",
    },
  ],

  // Airline — Domestic → lt-air-dom
  "lt-air-dom": [
    { type: "required", id: "e_ticket", label_en: "E-Ticket / Flight ticket", label_th: "E-Ticket / ตั๋วเครื่องบิน" },
    {
      type: "conditional_required",
      id: "travel_approval",
      label_en: "Travel Approval letter",
      label_th: "หนังสืออนุมัติเดินทาง",
      condition: "not_booked_via_cga",
      approver_level_options: ["director_or_above_hq", "sgm_store"],
      additional_approver: "associate_director_hr",
      hint_en: "Required if not booked through CGA. Approved by Director+ (HQ) or SGM (Store), with Associate Director-HR sign-off.",
    },
    {
      type: "required_one_of",
      id: "tax_invoice_or_receipt",
      label_en: "Tax Invoice or Receipt",
      label_th: "ใบกำกับภาษี หรือ ใบเสร็จรับเงิน",
      options: [
        { id: "tax_invoice", label_en: "Tax Invoice", label_th: "ใบกำกับภาษี" },
        { id: "receipt", label_en: "Receipt", label_th: "ใบเสร็จรับเงิน" },
      ],
    },
    { type: "optional", id: "boarding_pass", label_en: "Boarding Pass", label_th: "Boarding Pass" },
  ],

  // Accommodation Hotel — Domestic → lt-hotel-dom
  "lt-hotel-dom": [
    {
      type: "required_one_of",
      id: "hotel_invoice",
      label_en: "Hotel Folio / Receipt or Tax Invoice",
      label_th: "Hotel Folio / ใบเสร็จโรงแรม หรือ ใบกำกับภาษี",
      options: [
        { id: "hotel_folio", label_en: "Hotel Folio / Receipt", label_th: "Hotel Folio / ใบเสร็จโรงแรม" },
        { id: "tax_invoice", label_en: "Tax Invoice", label_th: "ใบกำกับภาษี" },
      ],
    },
    {
      type: "conditional_required",
      id: "travel_approval",
      label_en: "Travel Approval letter",
      label_th: "หนังสืออนุมัติเดินทาง",
      condition: "not_booked_via_cga",
      approver_level: "associate_director_hr",
      hint_en: "Required if not booked through CGA",
    },
    {
      type: "conditional_optional",
      id: "split_invoice",
      label_en: "Split invoice (2 invoices)",
      label_th: "ใบแยกบิล 2 ใบ",
      condition: "exceeds_room_budget",
      hint_en: "Use if room rate exceeds approved budget",
    },
    {
      type: "conditional_optional",
      id: "single_room_reason",
      label_en: "Reason for single occupancy",
      label_th: "หนังสืออธิบายเหตุผลพักเดี่ยว",
      condition: "shared_room_entitled",
      hint_en: "Use if entitled to shared room but staying single",
    },
  ],

  // Meal Restaurant — Business Meal → lt-meal
  "lt-meal": [
    { type: "required", id: "per_diem_form", label_en: "Per diem claim form", label_th: "แบบฟอร์มเบิกเบี้ยเลี้ยงเดินทาง" },
    { type: "required", id: "travel_approval", label_en: "Travel approval letter", label_th: "หนังสืออนุมัติเดินทาง" },
    { type: "optional", id: "meal_receipt", label_en: "Meal receipt", label_th: "ใบเสร็จอาหาร" },
  ],

  // Per Diem — Domestic → lt-perdiem
  "lt-perdiem": [
    { type: "required", id: "per_diem_form", label_en: "Per diem claim form", label_th: "แบบฟอร์มเบิกเบี้ยเลี้ยงเดินทาง" },
    { type: "required", id: "travel_approval", label_en: "Travel approval letter", label_th: "หนังสืออนุมัติเดินทาง" },
  ],

  // Courier / Postage → lt-postage
  "lt-postage": [
    { type: "required", id: "courier_receipt", label_en: "Courier receipt or shipment slip", label_th: "ใบเสร็จ Courier / ใบนำส่ง" },
  ],

  // Night Shift Meal → lt-night
  "lt-night": [
    { type: "required", id: "receipt", label_en: "Receipt", label_th: "ใบเสร็จรับเงิน" },
    { type: "required", id: "head_count", label_en: "Head count of staff served", label_th: "จำนวนพนักงานที่รับอาหาร", input_type: "number" },
    {
      type: "required",
      id: "work_type",
      label_en: "Work type",
      label_th: "ประเภทงาน",
      input_type: "select",
      options_select: ["Year-end Stock Take", "Cycle Stock", "Layout Remodeling", "Special Project"],
    },
    { type: "required", id: "work_proof", label_en: "Proof of 8+ hour shift", label_th: "หลักฐานการทำงาน ≥8 ชั่วโมง" },
  ],

  // Client Entertainment → e10
  "e10": [
    {
      type: "required",
      id: "ca005_form",
      label_en: "Entertainment Expense Claim Form (CA005) with attendees and business purpose",
      label_th: "Entertainment Expense Claim Form (CA005) พร้อมรายชื่อผู้เข้าร่วมและวัตถุประสงค์",
      input_type: "structured_form",
      structured_fields: [
        { id: "attendees", label_en: "Attendees (name, company, role)", label_th: "รายชื่อผู้เข้าร่วม (ชื่อ + บริษัท + ตำแหน่ง)", input_type: "list" },
        { id: "business_purpose", label_en: "Business purpose", label_th: "วัตถุประสงค์ทางธุรกิจ", input_type: "free_text" },
      ],
    },
    {
      type: "required_one_of",
      id: "tax_invoice_or_receipt",
      label_en: "Tax Invoice or Receipt",
      label_th: "ใบกำกับภาษี หรือ ใบเสร็จรับเงิน",
      options: [
        { id: "tax_invoice", label_en: "Tax Invoice", label_th: "ใบกำกับภาษี" },
        { id: "receipt", label_en: "Receipt", label_th: "ใบเสร็จรับเงิน" },
      ],
    },
    {
      type: "conditional_optional",
      id: "memo_threshold",
      label_en: "Memo / Justification",
      label_th: "Memo อธิบายเหตุผล",
      condition: "amount_exceeds_threshold",
      hint_en: "Required when amount exceeds entertainment threshold",
    },
  ],

  // Funeral — Wreath → ot-funeral
  "ot-funeral": [
    { type: "required", id: "death_certificate", label_en: "Death certificate", label_th: "ใบมรณะบัตร" },
    { type: "required", id: "welfare_form", label_en: "Welfare benefit application form", label_th: "แบบฟอร์มขอรับสวัสดิการ" },
    {
      type: "required",
      id: "wreath_receipt",
      label_en: "Wreath receipt",
      label_th: "ใบเสร็จค่าพวงหรีด",
      cap: { max_amount: 2000, currency: "THB" },
      hint_en: "Maximum 2,000 THB",
    },
    {
      type: "conditional_optional",
      id: "marriage_cert",
      label_en: "Marriage certificate (copy)",
      label_th: "สำเนาทะเบียนสมรส",
      condition: "deceased_is_spouse",
      hint_en: "Required if deceased is spouse",
    },
    {
      type: "conditional_optional",
      id: "birth_cert",
      label_en: "Birth certificate of child (copy)",
      label_th: "สำเนาสูติบัตรของบุตร",
      condition: "deceased_is_child",
      hint_en: "Required if deceased is child",
    },
  ],

  // Government License / Permit → ot-license
  "ot-license": [
    { type: "required", id: "govt_receipt", label_en: "Government office receipt", label_th: "ใบเสร็จจากหน่วยงานราชการ" },
    { type: "required", id: "license_doc", label_en: "New license / renewal document", label_th: "ใบอนุญาตฉบับใหม่ / ใบต่ออายุ" },
  ],

  // Community / Cultural → ot-community
  "ot-community": [
    { type: "required", id: "receipt", label_en: "Receipt or proof of payment", label_th: "ใบเสร็จรับเงิน / หลักฐานการชำระ" },
    { type: "required", id: "activity_note", label_en: "Activity description and community linkage", label_th: "บันทึกอธิบายกิจกรรมและความเชื่อมโยงกับชุมชน", input_type: "free_text" },
  ],

  // Wet Waste Disposal → ot-wetwaste
  "ot-wetwaste": [
    { type: "required", id: "disposal_receipt", label_en: "Receipt from waste disposal service", label_th: "ใบเสร็จจากผู้ให้บริการกำจัดขยะ" },
    { type: "required", id: "no_direct_payment_reason", label_en: "Reason direct payment was not possible", label_th: "บันทึกอธิบายเหตุผลที่ไม่สามารถรอ Direct Payment", input_type: "free_text" },
  ],

  // Damaged Claims — Customer → ot-damaged
  "ot-damaged": [
    { type: "required", id: "compensation_proof", label_en: "Receipt or proof of compensation", label_th: "ใบเสร็จ / หลักฐานการชดเชย" },
    { type: "required", id: "incident_report", label_en: "Incident report", label_th: "บันทึกเหตุการณ์", input_type: "free_text" },
  ],
};

export function getDocRequirementsForSubType(subTypeId: string): DocSlot[] {
  return DOC_REQUIREMENTS[subTypeId] ?? [];
}
