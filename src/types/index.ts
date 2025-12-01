export interface CollaboratorPayment {
  name: string;
  amount: number;
  paymentType?: "payment" | "charge"; // payment = monto fijo a pagar, charge = monto fijo a cobrar
}

export interface AgendaItem {
  id: string;
  userId: string;
  date: string | number; // YYYY-MM-DD string or Excel serial number
  time: string; // Start time (kept for backward compatibility)
  startTime?: string; // New: explicit start time
  endTime?: string; // New: end time (calculated or manual)
  duration?: number; // Duration in minutes (calculated from startTime and endTime)
  client: string; // Client Name (kept for backward compatibility and display)
  clientId?: string; // Link to Client document
  collaborator?: string; // Deprecated: kept for backward compatibility
  collaborators?: CollaboratorPayment[]; // New: multiple collaborators with individual payments
  location?: string;
  peopleCount: number;
  quotedAmount: number;
  deposit?: number; // Amount paid so far (Seña/Abono)
  service: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  myProfit: number;
  myPayment?: number; // What I pay myself if I work on this
  bank?: string;
  collaboratorPayment: number; // Deprecated: kept for backward compatibility
  comments?: string;
  reminders?: ReminderConfig[]; // Reminder notifications
  createdAt: number;
  updatedAt: number;
}

export interface ReminderConfig {
  id: string;
  type: "days" | "hours" | "minutes";
  value: number; // e.g., 1 day before, 2 hours before
  enabled: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: "owner" | "collaborator";
  createdAt: number;
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

// Tipos de ítems en el catálogo
export type CatalogItemType = "storable" | "digital" | "service";

// Interface base para todos los ítems del catálogo
export interface CatalogItem {
  id: string;
  userId: string;
  type: CatalogItemType;
  name: string;
  description?: string;
  price: number;

  // Campos específicos para Almacenables (productos físicos)
  stock?: number;
  minStock?: number;
  sku?: string;
  unit?: string; // ej: "unidad", "kg", "litro"

  // Campos específicos para Digitales
  downloadUrl?: string;
  fileSize?: string; // ej: "2.5 MB"
  format?: string; // ej: "PDF", "MP4", "ZIP"

  // Campos específicos para Servicios
  duration?: number; // en minutos

  createdAt: number;
  updatedAt: number;
}

// Mantener Service como alias para compatibilidad con código existente
export type Service = CatalogItem;

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
  tax?: number;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  method: "cash" | "card" | "transfer" | "other";
  date: number;
  notes?: string;
  reference?: string;
}

export interface Invoice {
  id: string;
  userId: string;
  number: string; // e.g. "INV-001"
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  date: number;
  dueDate?: number;
  status: "draft" | "pending" | "paid" | "cancelled";
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount?: number;
  discountType?: "percentage" | "fixed";
  total: number;
  amountPaid: number;
  balance: number;
  paymentHistory: PaymentRecord[];
  notes?: string;
  relatedAppointmentId?: string;
  paidAt?: number;
  sentAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface BusinessSettings {
  id?: string; // Firestore ID
  userId: string;
  businessName: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  taxId?: string;
  enabledCatalogTypes?: CatalogItemType[]; // Types of catalog items enabled for this business
  updatedAt: number;
}
