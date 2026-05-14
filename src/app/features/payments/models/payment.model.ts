// Payment Status
export type PaymentStatus =
  | 'PENDING'
  | 'INITIATED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'REVERSED';

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
  paymentAmount?: number | null;
}

export interface RazorpayVerifyRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface RazorpayPaymentStatusUpdateRequest {
  razorpayOrderId: string;
  razorpayPaymentId?: string | null;
  failureReason?: string | null;
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
  status: PaymentStatus;
  maxAllowedAmount: number;
  currency: string;
}

export interface SplitPaymentPlanRequest {
  purchaseOrderId: number;
  requestedAmount: number;
}

export interface SplitPaymentPlanResponse {
  purchaseOrderId: number;
  totalAmount: number;
  requestedAmount: number;
  remainingAmount: number;
  maxAllowedAmount: number;
  suggestedSplits: number[];
}

export interface PaymentLimitExceededResponse {
  status: number;
  errorCode: 'PAYMENT_LIMIT_EXCEEDED';
  message: string;
  requestedAmount: number;
  maxAllowedAmount: number;
  remainingAmount: number;
  splitAllowed: boolean;
}
