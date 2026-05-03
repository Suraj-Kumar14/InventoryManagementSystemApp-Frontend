export type PaymentStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'CANCELLED'
  | 'REJECTED'
  | 'REVERSED';

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'CARD' | 'NEFT' | 'RTGS' | 'IMPS' | 'OTHER';

export type PaymentAction =
  | 'CREATED'
  | 'UPDATED'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'MARKED_PAID'
  | 'PARTIALLY_PAID'
  | 'REVERSED';

export interface CreatePaymentRequest {
  purchaseOrderId: number;
  supplierId?: number | null;
  paymentAmount: number;
  paymentMethod: PaymentMethod;
  paymentDate?: string | null;
  transactionReference?: string | null;
  bankReference?: string | null;
  remarks?: string | null;
}

export interface UpdatePaymentRequest {
  paymentAmount: number;
  paymentMethod: PaymentMethod;
  paymentDate?: string | null;
  transactionReference?: string | null;
  bankReference?: string | null;
  remarks?: string | null;
}

export interface SubmitPaymentRequest {
  remarks?: string | null;
}

export interface ApprovePaymentRequest {
  approvalRemarks?: string | null;
}

export interface RejectPaymentRequest {
  rejectionReason: string;
}

export interface CancelPaymentRequest {
  cancellationReason: string;
}

export interface MarkPaymentPaidRequest {
  paymentMethod: PaymentMethod;
  paymentDate: string;
  transactionReference?: string | null;
  bankReference?: string | null;
  remarks?: string | null;
}

export interface ReversePaymentRequest {
  reversalReason: string;
}

export interface PaymentHistoryResponse {
  historyId: number;
  paymentId: number;
  action: PaymentAction | string;
  oldStatus?: PaymentStatus | null;
  newStatus?: PaymentStatus | null;
  actorId?: number | null;
  remarks?: string | null;
  actionAt?: string;
}

export interface PaymentResponse {
  paymentId: number;
  paymentNumber: string;
  purchaseOrderId: number;
  poNumber?: string | null;
  supplierId: number;
  supplierName?: string | null;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentAmount: number;
  poTotalAmount: number;
  previouslyPaidAmount: number;
  remainingAmount: number;
  currency: string;
  paymentDate?: string | null;
  transactionReference?: string | null;
  bankReference?: string | null;
  remarks?: string | null;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  reversalReason?: string | null;
  createdBy?: number | null;
  approvedBy?: number | null;
  paidBy?: number | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  cancelledAt?: string | null;
  paidAt?: string | null;
  reversedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  history?: PaymentHistoryResponse[];
}

export interface PaymentSummaryResponse {
  totalPayments: number;
  draftCount: number;
  pendingApprovalCount: number;
  approvedCount: number;
  partiallyPaidCount: number;
  paidCount: number;
  cancelledCount: number;
  rejectedCount: number;
  reversedCount: number;
  totalPaidAmount: number;
  pendingPaymentAmount: number;
  remainingPaymentAmount: number;
}

export interface PaymentAnalyticsResponse {
  totalPaid: number;
  totalPending: number;
  monthlyPaidTrend: Record<string, number>;
  paymentsByMethod: Record<string, number>;
  paymentsBySupplier: Record<string, number>;
  pendingApprovals: number;
  topPaidSuppliers: string[];
}

export interface PaymentListQuery {
  keyword?: string | null;
  purchaseOrderId?: number | null;
  supplierId?: number | null;
  status?: PaymentStatus | null;
  paymentMethod?: PaymentMethod | null;
  createdBy?: number | null;
  fromDate?: string | null;
  toDate?: string | null;
  minAmount?: number | null;
  maxAmount?: number | null;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}
