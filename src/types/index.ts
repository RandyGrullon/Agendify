export interface AgendaItem {
  id: string;
  userId: string;
  date: string | number; // YYYY-MM-DD string or Excel serial number
  time: string;
  client: string; // Client Name (kept for backward compatibility and display)
  clientId?: string; // Link to Client document
  collaborator?: string;
  location?: string;
  peopleCount: number;
  quotedAmount: number;
  deposit?: number; // Amount paid so far (Seña/Abono)
  service: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  myProfit: number;
  bank?: string;
  collaboratorPayment: number;
  comments?: string;
  createdAt: number;
  updatedAt: number;
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

export interface Service {
  id: string;
  userId: string;
  name: string;
  description?: string;
  price: number;
  duration: number; // in minutes
  createdAt: number;
  updatedAt: number;
}

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
  footerMessage?: string;
  updatedAt: number;
}
