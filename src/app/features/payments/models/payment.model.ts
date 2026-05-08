// Payment Status
export type PaymentStatus =
  | 'PENDING_APPROVAL'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'CANCELLED';

// Payment Method
export type PaymentMethod = 'RAZORPAY';

// ─── Core Response ────────────────────────────────────────────────────────────

export interface PaymentResponse {
  paymentId?: number | null;
  paymentNumber?: string | null;
  purchaseOrderId?: number | null;
  poNumber?: string | null;
  supplierId?: number | null;
  supplierName?: string | null;
  status?: PaymentStatus | null;
  paymentMethod?: PaymentMethod | null;
  paymentAmount?: number | null;
  poTotalAmount?: number | null;
  previouslyPaidAmount?: number | null;
  remainingAmount?: number | null;
  currency?: string | null;
  paymentDate?: string | null;
  transactionReference?: string | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  createdBy?: number | null;
  paidBy?: number | null;
  paidAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

// ─── Query ────────────────────────────────────────────────────────────────────

export interface PaymentListQuery {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

// ─── Razorpay Models ──────────────────────────────────────────────────────────

export interface RazorpayInitiateRequest {
  purchaseOrderId: number;
}

export interface RazorpayVerifyRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface RazorpayOrderResponse {
  razorpayOrderId: string;
  paymentNumber: string;
  purchaseOrderId: number;
  amount: number;
  currency: string;
  keyId: string;
  description?: string | null;
}

export interface RemainingAmountResponse {
  purchaseOrderId: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  currency: string;
}
