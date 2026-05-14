import {
  AlertSummaryResponse,
  ExecutiveDashboardReportResponse,
  PaymentSummaryReportResponse,
  PurchaseOrderSummaryResponse,
  PurchaseSummaryReportResponse,
  SupplierPerformanceReportResponse,
  SupplierSummaryResponse,
} from '../../../core/http/backend.models';

/** Minimal payment summary derived from Razorpay payments — replaces the old PaymentSummaryResponse. */
export interface RazorpayPaymentSummary {
  pendingApprovalCount: number;
  approvedCount: number;
  paidCount: number;
  cancelledCount: number;
  totalPaidAmount: number;
  pendingPaymentAmount: number;
  totalPayments: number;
}

export type PurchaseOfficerDashboardSectionKey =
  | 'dashboard'
  | 'purchase'
  | 'suppliers'
  | 'procurement'
  | 'payments'
  | 'alerts';

export interface PurchaseOrderSummaryItem {
  purchaseOrderId: number;
  poNumber: string;
  supplierName: string;
  warehouseName: string;
  status: string;
  totalAmount: number;
  expectedDeliveryDate?: string | null;
  createdAt?: string;
  route: string;
}

export interface SupplierSummaryItem {
  supplierId: number;
  supplierName: string;
  rating: number;
  leadTimeDays: number;
  status: string;
  totalOrders: number;
  totalSpend: number;
  route: string;
}

export interface ProcurementAttentionItem {
  productId: number;
  sku: string;
  productName: string;
  warehouseId: number;
  warehouseName: string;
  availableQuantity: number;
  reorderLevel: number;
  shortageQuantity: number;
  preferredSupplierId?: number | null;
  preferredSupplierName?: string | null;
  route: string;
}

export interface PaymentSummaryItem {
  paymentId: number;
  paymentNumber: string;
  poNumber: string;
  supplierName: string;
  status: string;
  amount: number;
  paymentDate?: string | null;
  route: string;
}

export interface PurchaseOfficerRecentAlert {
  alertId: number;
  title: string;
  severity: string;
  type: string;
  createdAt?: string;
  route: string;
}

export interface PurchaseOfficerDashboardResponse {
  totalPurchaseOrders: number;
  draftPurchaseOrders: number;
  pendingApprovalPurchaseOrders: number;
  approvedPurchaseOrders: number;
  approvedAwaitingReceiptPurchaseOrders: number;
  receivedPurchaseOrders: number;
  cancelledPurchaseOrders: number;
  overduePurchaseOrders: number;
  totalPurchaseValue: number;
  pendingPurchaseValue: number;
  activeSuppliers: number;
  inactiveSuppliers: number;
  averageSupplierRating: number;
  averageSupplierLeadTime: number;
  pendingPayments: number;
  approvedPayments: number;
  paidAmount: number;
  pendingPaymentAmount: number;
  unreadAlerts: number;
  criticalAlerts: number;
}

export interface PurchaseOfficerKpiCard {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  route?: string;
  severity?: 'default' | 'warning' | 'critical' | 'success';
}

export interface PurchaseOfficerDashboardView {
  roleDashboard: ExecutiveDashboardReportResponse | null;
  overview: PurchaseOfficerDashboardResponse | null;
  purchaseSummary: PurchaseOrderSummaryResponse | null;
  purchaseReportSummary?: PurchaseSummaryReportResponse | null;
  recentPurchaseOrders: PurchaseOrderSummaryItem[];
  supplierSummary: SupplierSummaryResponse | null;
  topRatedSuppliers: SupplierSummaryItem[];
  lowRatedSuppliers: SupplierSummaryItem[];
  supplierPerformance: SupplierPerformanceReportResponse[];
  procurementAttentionItems: ProcurementAttentionItem[];
  paymentSummary: RazorpayPaymentSummary | null;
  paymentReportSummary: PaymentSummaryReportResponse | null;
  recentPayments: PaymentSummaryItem[];
  recentAlerts: PurchaseOfficerRecentAlert[];
  alertSummary: AlertSummaryResponse | null;
  paymentSectionEnabled: boolean;
  sectionErrors: Partial<Record<PurchaseOfficerDashboardSectionKey, string>>;
  generatedAt: string;
}
