export interface DocumentType {
  id: string;
  name: string;
  type: "Primary" | "Support";
  ocr: "Enabled" | "Disabled";
  active: boolean;
}

const STORAGE_KEY = "pc360.documents.v1";

const seed: DocumentType[] = [
  { id: "tax-invoice", name: "Tax Invoice", type: "Primary", ocr: "Enabled", active: true },
  { id: "receipt", name: "Receipt", type: "Primary", ocr: "Enabled", active: true },
  { id: "boarding-pass", name: "Boarding Pass", type: "Support", ocr: "Disabled", active: true },
  { id: "hotel-folio", name: "Hotel Folio", type: "Primary", ocr: "Enabled", active: true },
  { id: "quotation", name: "Quotation", type: "Support", ocr: "Disabled", active: true },
  { id: "approval-form", name: "Approval Form", type: "Support", ocr: "Disabled", active: false },
];

export function loadDocuments(): DocumentType[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;
    return JSON.parse(raw) as DocumentType[];
  } catch {
    return seed;
  }
}

export function saveDocuments(docs: DocumentType[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  } catch {
    // ignore
  }
}

export function getDocument(id: string): DocumentType | undefined {
  return loadDocuments().find((d) => d.id === id);
}

export function updateDocument(id: string, patch: Partial<DocumentType>) {
  const docs = loadDocuments();
  const next = docs.map((d) => (d.id === id ? { ...d, ...patch } : d));
  saveDocuments(next);
  return next;
}
