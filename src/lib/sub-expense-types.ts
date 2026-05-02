// Master list of sub-expense types shown in the /claims/new TilePicker.
// Hardcoded for now — moves to DB when Admin Configuration is built.
// IDs map 1:1 to expenseTypes[].id in mock-data.ts (so doc-policy + GL lookups continue to work).

export type SubExpenseTypeGroup =
  | "Local Travelling"
  | "Meals & Entertainment"
  | "Postage"
  | "Staff Meeting"
  | "Other";

export interface SubExpenseTypeDef {
  id: string;            // matches expenseTypes.id
  group: SubExpenseTypeGroup;
  en: string;            // English name (display)
  th: string;            // Thai name
  emoji: string;         // native emoji rendered in the TilePicker
}

// Group display order (per BRD volume).
export const SUB_EXPENSE_GROUP_ORDER: SubExpenseTypeGroup[] = [
  "Local Travelling",
  "Meals & Entertainment",
  "Postage",
  "Staff Meeting",
  "Other",
];

export const SUB_EXPENSE_TYPES: SubExpenseTypeDef[] = [
  // Local Travelling (12)
  { id: "lt-taxi",       group: "Local Travelling",    en: "Taxi / Grab",                    th: "ค่าแท็กซี่",            emoji: "🚖" },
  { id: "lt-train",      group: "Local Travelling",    en: "Train / Inter-city Bus",         th: "ค่ารถไฟ / รถทัวร์",     emoji: "🚆" },
  { id: "lt-car",        group: "Local Travelling",    en: "Personal Car — Mileage",         th: "ค่าน้ำมันรถส่วนตัว",     emoji: "⛽" },
  { id: "lt-ev",         group: "Local Travelling",    en: "EV Car — Mileage",               th: "ค่าชาร์จรถ EV",        emoji: "🔋" },
  { id: "lt-toll",       group: "Local Travelling",    en: "Toll Fees",                      th: "ค่าทางด่วน",           emoji: "🛣️" },
  { id: "lt-airpark",    group: "Local Travelling",    en: "Airport Parking",                th: "ค่าจอดรถสนามบิน",       emoji: "🅿️" },
  { id: "lt-otherpark",  group: "Local Travelling",    en: "Other Parking",                  th: "ค่าจอดรถอื่นๆ",         emoji: "🅿️" },
  { id: "lt-rental",     group: "Local Travelling",    en: "Car Rental",                     th: "ค่ารถเช่า",            emoji: "🚗" },
  { id: "lt-air-dom",    group: "Local Travelling",    en: "Airline — Domestic",             th: "ตั๋วเครื่องบินในประเทศ",  emoji: "✈️" },
  { id: "lt-hotel-dom",  group: "Local Travelling",    en: "Accommodation Hotel — Domestic", th: "ค่าโรงแรมในประเทศ",     emoji: "🏨" },
  { id: "lt-meal",       group: "Local Travelling",    en: "Meal Restaurant — Business Meal",th: "มื้ออาหารธุรกิจ",        emoji: "🍱" },
  { id: "lt-perdiem",    group: "Local Travelling",    en: "Per Diem — Domestic",            th: "เบี้ยเลี้ยงเดินทาง",      emoji: "💵" },

  // Meals & Entertainment (1)
  { id: "e10",           group: "Meals & Entertainment", en: "Client Entertainment",         th: "รับรองลูกค้า",          emoji: "🥂" },

  // Postage (1)
  { id: "lt-postage",    group: "Postage",             en: "Courier / Postage",              th: "ค่าจัดส่งพัสดุ",         emoji: "📦" },

  // Staff Meeting (1)
  { id: "lt-night",      group: "Staff Meeting",       en: "Night Shift Meal",               th: "อาหารกะกลางคืน",        emoji: "🌙" },

  // Other (5)
  { id: "ot-funeral",    group: "Other",               en: "Funeral — Wreath",               th: "ค่าพวงหรีดงานศพ",       emoji: "💐" },
  { id: "ot-license",    group: "Other",               en: "Government License / Permit",    th: "ค่าธรรมเนียมราชการ",     emoji: "🏛️" },
  { id: "ot-community",  group: "Other",               en: "Community / Cultural",           th: "กิจกรรมชุมชน",          emoji: "🤝" },
  { id: "ot-wetwaste",   group: "Other",               en: "Wet Waste Disposal",             th: "ค่ากำจัดของเสียเปียก",   emoji: "🗑️" },
  { id: "ot-damaged",    group: "Other",               en: "Damaged Claims — Customer",      th: "ค่าชดเชยลูกค้า",         emoji: "⚠️" },
];

export const getSubExpenseTypeById = (id: string): SubExpenseTypeDef | undefined =>
  SUB_EXPENSE_TYPES.find(s => s.id === id);
