import { UserRole } from '../../shared/config/app-config';

export interface ValidationErrors {
  [key: string]: string;
}

export interface BackendErrorResponse {
  message?: string;
  error?: string;
  status?: number;
  timestamp?: string;
  path?: string;
}

export interface UserProfile {
  userId: number;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  department?: string | null;
  isActive?: boolean;
  createdAt?: string;
  lastLoginAt?: string | null;
}

export interface AdminUserSummary {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminCount: number;
  inventoryManagerCount: number;
  purchaseOfficerCount: number;
  warehouseStaffCount: number;
  recentLoginCount?: number;
}

export interface CreateAdminUserRequest {
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  department?: string | null;
  password: string;
  isActive?: boolean;
}

export interface UpdateAdminUserRequest {
  name: string;
  email: string;
  phone?: string | null;
  department?: string | null;
  isActive?: boolean;
}

export interface UpdateProfileRequest {
  name: string;
  phone?: string | null;
  department?: string | null;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface Product {
  productId: number;
  sku: string;
  name: string;
  description?: string | null;
  category: string;
  brand?: string | null;
  unitOfMeasure: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  maxStockLevel: number;
  leadTimeDays: number;
  imageUrl?: string | null;
  barcode?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductRequest {
  sku: string;
  name: string;
  description?: string | null;
  category: string;
  brand?: string | null;
  unitOfMeasure: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  maxStockLevel: number;
  leadTimeDays: number;
  imageUrl?: string | null;
  barcode?: string | null;
}

export interface UpdateProductRequest {
  name: string;
  description?: string | null;
  category: string;
  brand?: string | null;
  unitOfMeasure: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  maxStockLevel: number;
  leadTimeDays: number;
  imageUrl?: string | null;
  barcode?: string | null;
  isActive?: boolean | null;
}

export interface ProductSummary {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  categoriesCount: number;
  brandsCount: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface SupplierResponse {
  supplierId: number;
  supplierCode?: string | null;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  taxNumber?: string | null;
  taxId?: string | null;
  gstNumber?: string | null;
  paymentTerms?: string | null;
  leadTimeDays: number;
  rating?: number | null;
  status?: SupplierStatus | null;
  notes?: string | null;
  createdBy?: number | null;
  updatedBy?: number | null;
  totalOrders?: number | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type SupplierStatus = 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED' | 'PENDING_REVIEW';

export interface CreateSupplierRequest {
  supplierCode?: string | null;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  taxNumber?: string | null;
  gstNumber?: string | null;
  paymentTerms: string;
  leadTimeDays: number;
  rating?: number | null;
  notes?: string | null;
}

export interface UpdateSupplierRequest extends CreateSupplierRequest {
  status?: SupplierStatus | null;
  isActive?: boolean | null;
}

export interface UpdateSupplierRatingRequest {
  rating: number;
  qualityRating?: number | null;
  deliveryRating?: number | null;
  communicationRating?: number | null;
  priceRating?: number | null;
  remarks?: string | null;
}

export interface DeactivateSupplierRequest {
  reason: string;
}

export interface BlacklistSupplierRequest {
  reason: string;
}

export interface SupplierSummaryResponse {
  totalSuppliers: number;
  activeSuppliers: number;
  inactiveSuppliers: number;
  blacklistedSuppliers: number;
  pendingReviewSuppliers: number;
  averageRating: number;
  averageLeadTimeDays: number;
}

export interface SupplierPerformanceResponse {
  supplierId: number;
  supplierName: string;
  totalOrders: number;
  completedOrders: number;
  delayedOrders: number;
  totalSpend: number;
  averageDeliveryDelayDays: number;
  qualityRating: number;
  deliveryRating: number;
  overallRating: number;
  lastEvaluatedAt?: string | null;
}

export interface SupplierPurchaseValidationResponse {
  supplierId: number;
  supplierName: string;
  isActive: boolean;
  status: SupplierStatus;
  paymentTerms?: string | null;
  leadTimeDays: number;
  canUseForPurchase: boolean;
  reason?: string | null;
}

export type ProductRequest = CreateProductRequest;
export type ProductResponse = Product;
export type SupplierRequest = CreateSupplierRequest;

export interface WarehouseRequest {
  name: string;
  code: string;
  location: string;
  address?: string | null;
  managerId?: number | null;
  capacity: number;
  phone?: string | null;
  isActive?: boolean | null;
}

export interface WarehouseResponse {
  warehouseId: number;
  name: string;
  code: string;
  location: string;
  address?: string | null;
  managerId?: number | null;
  capacity: number;
  usedCapacity?: number | null;
  availableCapacity?: number | null;
  utilizationPercentage?: number | null;
  phone?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface WarehouseSummaryResponse {
  totalWarehouses: number;
  activeWarehouses: number;
  inactiveWarehouses: number;
  totalCapacity: number;
  usedCapacity: number;
  availableCapacity: number;
  averageUtilizationPercentage: number;
}

export interface StockLevelResponse {
  stockId: number;
  warehouseId: number;
  warehouseName?: string | null;
  productId: number;
  productName?: string | null;
  sku?: string | null;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  binLocation?: string | null;
  locationCode?: string | null;
  lastUpdated?: string;
}

export interface WarehouseStockMovementResponse {
  movementId: number;
  warehouseId: number;
  productId: number;
  movementType: string;
  quantityChanged: number;
  previousQuantity: number;
  newQuantity: number;
  relatedWarehouseId?: number | null;
  reason?: string | null;
  createdAt?: string;
}

export interface StockUpdateRequest {
  warehouseId: number;
  productId: number;
  quantity: number;
  reason?: string | null;
  notes?: string | null;
}

export interface StockTransferRequest {
  sourceWarehouseId: number;
  destinationWarehouseId: number;
  productId: number;
  quantity: number;
  reasonCode: string;
  notes?: string | null;
}

export interface StockReceiptRequest {
  warehouseId: number;
  productId: number;
  quantity: number;
  referenceId?: string | null;
  referenceType?: string | null;
  unitCost?: number | null;
  notes?: string | null;
}

export interface StockIssueRequest {
  warehouseId: number;
  productId: number;
  quantity: number;
  referenceId?: string | null;
  referenceType?: string | null;
  reason?: string | null;
  notes?: string | null;
}

export interface ReserveStockRequest {
  warehouseId: number;
  productId: number;
  quantity: number;
  referenceId?: string | null;
  referenceType?: string | null;
  reason?: string | null;
}

export interface ReleaseReservationRequest {
  warehouseId: number;
  productId: number;
  quantity: number;
  referenceId?: string | null;
  referenceType?: string | null;
  reason?: string | null;
}

export interface AdjustStockRequest {
  warehouseId: number;
  productId: number;
  newQuantity: number;
  reason?: string | null;
  notes?: string | null;
}

export interface StockSummaryResponse {
  totalStockItems: number;
  totalQuantity: number;
  totalReservedQuantity: number;
  totalAvailableQuantity: number;
  lowStockItemsCount: number;
  overstockItemsCount: number;
}

export interface TransferStockResponse {
  transferId?: number | null;
  productId: number;
  sourceWarehouseId: number;
  destinationWarehouseId: number;
  quantity: number;
  sourceBalanceAfter: number;
  destinationBalanceAfter: number;
  status: string;
  message: string;
  transferredAt?: string;
}

export interface StockAuditRequest {
  warehouseId: number;
  productId: number;
  countedQuantity: number;
  reason: string;
  binLocation?: string | null;
  reorderLevel?: number | null;
  maxStockLevel?: number | null;
}

export interface StockAuditResponse {
  warehouseId: number;
  productId: number;
  systemQuantity: number;
  countedQuantity: number;
  discrepancy: number;
  reason: string;
  updatedStock: StockLevelResponse;
}

export interface BarcodeProductLookupResponse {
  productId: number;
  sku: string;
  name: string;
  category?: string | null;
  brand?: string | null;
  barcode?: string | null;
  reorderLevel?: number | null;
  maxStockLevel?: number | null;
  isActive?: boolean | null;
}

export interface BarcodeStockLookupResponse {
  product: BarcodeProductLookupResponse;
  stockLevels: StockLevelResponse[];
}

export interface WarehouseStockAlertResponse {
  alertId: number;
  warehouseId: number;
  productId: number;
  alertType: string;
  currentQuantity: number;
  thresholdValue?: number | null;
  active: boolean;
  acknowledged: boolean;
  acknowledgedBy?: string | null;
  acknowledgedAt?: string | null;
  message?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AcknowledgeWarehouseStockAlertRequest {
  acknowledgedBy: string;
}

export interface PurchaseOrderLineItemRequest {
  productId: number;
  quantity: number;
  unitCost: number;
}

export interface PurchaseOrderRequest {
  supplierId: number;
  warehouseId: number;
  createdById: number;
  lineItems: PurchaseOrderLineItemRequest[];
  expectedDate?: string | null;
  notes?: string | null;
  referenceNumber?: string | null;
}

export interface PurchaseOrderLineItemResponse {
  lineItemId: number;
  productId: number;
  productSku?: string | null;
  productName?: string | null;
  quantity: number;
  orderedQuantity?: number;
  unitCost: number;
  totalCost: number;
  lineTotal?: number;
  receivedQty: number;
  receivedQuantity?: number;
  pendingQuantity?: number;
  notes?: string | null;
}

export interface PurchaseOrderResponse {
  poId: number;
  purchaseOrderId?: number;
  poNumber?: string | null;
  supplierId: number;
  supplierName?: string | null;
  warehouseId: number;
  warehouseName?: string | null;
  createdById: number;
  createdBy?: number;
  createdByName?: string | null;
  approvedBy?: number | null;
  approvedByName?: string | null;
  status: string;
  subtotalAmount?: number;
  taxAmount?: number;
  discountAmount?: number;
  shippingAmount?: number;
  totalAmount: number;
  orderDate?: string;
  expectedDate?: string | null;
  expectedDeliveryDate?: string | null;
  receivedDate?: string | null;
  actualDeliveryDate?: string | null;
  paymentTerms?: string | null;
  notes?: string | null;
  approvalRemarks?: string | null;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  referenceNumber?: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  cancelledAt?: string | null;
  receivedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  isOverdue?: boolean;
  lineItems: PurchaseOrderLineItemResponse[];
  history?: PurchaseOrderHistoryResponse[];
}

export interface GoodsReceiptRequest {
  lineItemId: number;
  receivedQty: number;
}

export interface CreatePurchaseOrderLineItemRequest {
  productId: number;
  orderedQuantity: number;
  unitCost: number;
  notes?: string | null;
}

export interface CreatePurchaseOrderRequest {
  supplierId: number;
  warehouseId: number;
  expectedDeliveryDate: string;
  paymentTerms?: string | null;
  notes?: string | null;
  lineItems: CreatePurchaseOrderLineItemRequest[];
}

export interface UpdatePurchaseOrderRequest {
  supplierId: number;
  warehouseId: number;
  expectedDeliveryDate: string;
  paymentTerms?: string | null;
  notes?: string | null;
  taxAmount?: number | null;
  discountAmount?: number | null;
  shippingAmount?: number | null;
  lineItems: CreatePurchaseOrderLineItemRequest[];
}

export interface SubmitPurchaseOrderRequest {
  remarks?: string | null;
}

export interface ApprovePurchaseOrderRequest {
  approvalRemarks?: string | null;
}

export interface RejectPurchaseOrderRequest {
  rejectionReason: string;
}

export interface CancelPurchaseOrderRequest {
  cancellationReason: string;
}

export interface ReceivePurchaseOrderLineItemRequest {
  lineItemId: number;
  productId: number;
  receivedQuantity: number;
  unitCost?: number | null;
  notes?: string | null;
}

export interface ReceivePurchaseOrderRequest {
  purchaseOrderId: number;
  receiptReference?: string | null;
  receivedDate?: string | null;
  notes?: string | null;
  lineItems: ReceivePurchaseOrderLineItemRequest[];
}

export interface PurchaseOrderHistoryResponse {
  historyId: number;
  action: string;
  oldStatus?: string | null;
  newStatus?: string | null;
  actorId?: number | null;
  remarks?: string | null;
  actionAt?: string;
}

export interface PurchaseOrderSummaryResponse {
  totalPurchaseOrders: number;
  draftCount: number;
  pendingApprovalCount: number;
  approvedCount: number;
  partiallyReceivedCount: number;
  receivedCount: number;
  cancelledCount: number;
  rejectedCount: number;
  overdueCount: number;
  totalPurchaseValue: number;
  pendingPurchaseValue: number;
  receivedPurchaseValue: number;
}

export interface PurchaseAnalyticsResponse {
  totalSpend: number;
  monthlySpend: number;
  topSuppliers: string[];
  topPurchasedProducts: string[];
  pendingApprovals: number;
  overdueReceipts: number;
  averageApprovalTime: number;
  averageDeliveryDelay: number;
}

export type MovementType =
  | 'STOCK_IN'
  | 'STOCK_OUT'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'ADJUSTMENT'
  | 'WRITE_OFF'
  | 'RETURN'
  | 'RESERVATION'
  | 'RESERVATION_RELEASE'
  | 'CYCLE_COUNT_CORRECTION'
  | 'REVERSAL';

export type MovementDirection = 'IN' | 'OUT' | 'NEUTRAL';

export type ReferenceType =
  | 'PURCHASE_ORDER'
  | 'GRN'
  | 'SALES_ORDER'
  | 'TRANSFER'
  | 'ADJUSTMENT'
  | 'WRITE_OFF'
  | 'RETURN'
  | 'CYCLE_COUNT'
  | 'MANUAL_CORRECTION'
  | 'SYSTEM';

export type MovementReasonCode =
  | 'PURCHASE_RECEIPT'
  | 'STOCK_ISSUE'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'DAMAGED'
  | 'EXPIRED'
  | 'LOST'
  | 'FOUND'
  | 'COUNT_MISMATCH'
  | 'RETURNED'
  | 'MANUAL_CORRECTION'
  | 'SYSTEM_CORRECTION'
  | 'OTHER';

export interface CreateMovementRequest {
  productId: number;
  warehouseId: number;
  movementType: MovementType;
  direction: MovementDirection;
  quantity: number;
  unitCost?: number | null;
  balanceAfter: number;
  referenceType?: ReferenceType | null;
  referenceId?: string | null;
  referenceNumber?: string | null;
  reasonCode?: MovementReasonCode | null;
  notes?: string | null;
  movementDate?: string | null;
  sourceService?: string | null;
  correlationId?: string | null;
}

export interface ReverseMovementRequest {
  reasonCode: MovementReasonCode;
  notes?: string | null;
}

export interface MovementSearchRequest {
  keyword?: string;
  productId?: number;
  warehouseId?: number;
  movementType?: MovementType;
  direction?: MovementDirection;
  referenceType?: ReferenceType;
  referenceId?: string;
  performedBy?: number;
  fromDate?: string;
  toDate?: string;
  minQuantity?: number;
  maxQuantity?: number;
  isReversal?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface MovementResponse {
  movementId: number;
  movementNumber: string;
  productId: number;
  productSku?: string | null;
  productName?: string | null;
  warehouseId: number;
  warehouseCode?: string | null;
  warehouseName?: string | null;
  movementType: MovementType;
  direction: MovementDirection;
  quantity: number;
  referenceType?: ReferenceType | null;
  referenceId?: string | null;
  referenceNumber?: string | null;
  unitCost?: number | null;
  totalValue: number;
  performedBy?: number | null;
  performedByName?: string | null;
  reasonCode?: MovementReasonCode | null;
  notes?: string | null;
  relatedMovementId?: number | null;
  isReversal: boolean;
  movementDate?: string;
  createdAt?: string;
  balanceAfter: number;
  sourceService?: string | null;
  correlationId?: string | null;
}

export interface MovementSummaryResponse {
  totalMovements: number;
  totalStockInQuantity: number;
  totalStockOutQuantity: number;
  totalTransferQuantity: number;
  totalAdjustmentQuantity: number;
  totalWriteOffQuantity: number;
  totalReturnQuantity: number;
  totalMovementValue: number;
  movementsToday: number;
  movementsThisMonth: number;
}

export interface MovementAnalyticsItem {
  productId: number;
  productName: string;
  quantity: number;
  totalValue: number;
}

export interface MovementTrendPoint {
  date: string;
  quantity: number;
}

export interface MovementAnalyticsResponse {
  movementCountByType: Record<string, number>;
  movementCountByWarehouse: Record<string, number>;
  movementCountByProduct: Record<string, number>;
  dailyMovementTrend: Record<string, number>;
  topMovedProducts: MovementAnalyticsItem[];
  highestValueMovements: MovementResponse[];
  adjustmentTrend: MovementTrendPoint[];
  writeOffTrend: MovementTrendPoint[];
}

export type StockMovementRequest = CreateMovementRequest;
export type StockMovementResponse = MovementResponse;

export type AlertType =
  | 'LOW_STOCK'
  | 'OVERSTOCK'
  | 'PO_APPROVAL_PENDING'
  | 'PO_APPROVED'
  | 'PO_REJECTED'
  | 'PO_OVERDUE_RECEIPT'
  | 'PO_RECEIVED'
  | 'SUPPLIER_DEACTIVATED'
  | 'SUPPLIER_BLACKLISTED'
  | 'MOVEMENT_ANOMALY'
  | 'STOCK_TRANSFER'
  | 'SYSTEM_BROADCAST'
  | 'REPORT_READY'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_COMPLETED'
  | 'GENERAL';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertStatus = 'NEW' | 'READ' | 'ACKNOWLEDGED' | 'DISMISSED' | 'RESOLVED' | 'EXPIRED';
export type AlertChannel = 'IN_APP' | 'EMAIL' | 'BOTH';

export interface CreateAlertRequest {
  recipientId?: number | null;
  recipientRole?: string | null;
  type: AlertType;
  severity: AlertSeverity;
  channel: AlertChannel;
  title: string;
  message: string;
  relatedProductId?: number | null;
  relatedWarehouseId?: number | null;
  relatedPurchaseOrderId?: number | null;
  relatedSupplierId?: number | null;
  relatedMovementId?: number | null;
  referenceType?: string | null;
  referenceId?: string | null;
  referenceNumber?: string | null;
  expiresAt?: string | null;
  actionUrl?: string | null;
  metadataJson?: string | null;
}

export interface CreateBroadcastAlertRequest {
  recipientRoles: string[];
  recipientIds?: number[] | null;
  severity: AlertSeverity;
  title: string;
  message: string;
  expiresAt?: string | null;
  actionUrl?: string | null;
}

export interface AcknowledgeAlertRequest {
  remarks?: string | null;
}

export interface DismissAlertRequest {
  reason?: string | null;
}

export interface AlertSearchRequest {
  keyword?: string;
  recipientId?: number;
  recipientRole?: string;
  type?: AlertType;
  severity?: AlertSeverity;
  status?: AlertStatus;
  isRead?: boolean;
  isAcknowledged?: boolean;
  isDismissed?: boolean;
  referenceType?: string;
  referenceId?: string;
  sourceService?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface AlertResponse {
  alertId: number;
  alertNumber: string;
  recipientId?: number | null;
  recipientRole?: string | null;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  channel: AlertChannel;
  title: string;
  message: string;
  relatedProductId?: number | null;
  relatedWarehouseId?: number | null;
  relatedPurchaseOrderId?: number | null;
  relatedSupplierId?: number | null;
  relatedMovementId?: number | null;
  referenceType?: string | null;
  referenceId?: string | null;
  referenceNumber?: string | null;
  isRead: boolean;
  isAcknowledged: boolean;
  isDismissed: boolean;
  readAt?: string | null;
  acknowledgedAt?: string | null;
  dismissedAt?: string | null;
  createdAt?: string;
  expiresAt?: string | null;
  sourceService?: string | null;
  actionUrl?: string | null;
  metadataJson?: string | null;
}

export interface AlertSummaryResponse {
  totalAlerts: number;
  unreadCount: number;
  acknowledgedCount: number;
  dismissedCount: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  lowStockCount: number;
  overstockCount: number;
  pendingPoApprovalCount: number;
  overduePoCount: number;
}

export interface AlertAnalyticsCountItem {
  id: number;
  count: number;
}

export interface AlertAnalyticsResponse {
  alertsByType: Record<string, number>;
  alertsBySeverity: Record<string, number>;
  alertsByStatus: Record<string, number>;
  alertsByRole: Record<string, number>;
  dailyAlertTrend: Record<string, number>;
  topAlertedProducts: AlertAnalyticsCountItem[];
  topAlertedWarehouses: AlertAnalyticsCountItem[];
}

export interface InventorySnapshot {
  snapshotId: number;
  warehouseId: number;
  productId: number;
  quantity: number;
  stockValue: number;
  snapshotDate?: string;
  createdAt?: string;
}

export interface StockValuation {
  warehouseId?: number | null;
  totalValue: number;
  asOfDate?: string;
  totalProducts?: number | null;
}

export interface InventoryTurnover {
  startDate?: string;
  endDate?: string;
  startInventoryValue?: number;
  endInventoryValue?: number;
  cogs?: number;
  averageInventoryValue: number;
  inventoryTurnover?: number;
  note?: string;
}

export interface DeadStockItem {
  productId: number;
  warehouseId: number;
  currentQuantity: number;
  lastMovementDate?: string | null;
  daysWithoutMovement: number;
}

export interface TopMovingProduct {
  productId: number;
  productName: string;
  warehouseId: number;
  totalUnitsIn: number;
  totalUnitsOut: number;
  totalMovement: number;
}

export interface POSummary {
  fromDate?: string;
  toDate?: string;
  totalPOs: number;
  totalSpend: number;
  approvedPOs: number;
  pendingPOs: number;
  cancelledPOs: number;
  fullyReceivedPOs: number;
}

export interface StockMovementSummary {
  warehouseId: number | 'ALL';
  fromDate: string;
  toDate: string;
  totalStockIn: number;
  totalStockOut: number;
  totalAdjustments: number;
  totalTransfers: number;
}

export type ReportPeriod = 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM';
export type ReportExportFormat = 'CSV' | 'EXCEL' | 'PDF';

export interface ReportFilter {
  fromDate?: string;
  toDate?: string;
  productId?: number;
  warehouseId?: number;
  supplierId?: number;
  category?: string;
  brand?: string;
  movementType?: string;
  poStatus?: string;
  paymentStatus?: string;
  alertSeverity?: string;
  period?: ReportPeriod;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface WarehouseValuationItem {
  warehouseId: number;
  warehouseName: string;
  totalQuantity: number;
  totalValue: number;
}

export interface ProductValuationItem {
  productId: number;
  sku?: string | null;
  productName: string;
  category?: string | null;
  warehouseId: number;
  warehouseName?: string | null;
  quantity: number;
  unitCost: number;
  totalValue: number;
}

export interface InventoryValuationReportResponse {
  totalInventoryValue: number;
  totalQuantity: number;
  totalProducts: number;
  totalWarehouses: number;
  valuationByWarehouse: WarehouseValuationItem[];
  valuationByCategory: Record<string, number>;
  valuationByProduct: ProductValuationItem[];
}

export interface InventoryReportSummaryResponse {
  totalProducts: number;
  totalWarehouses: number;
  totalStockQuantity: number;
  totalReservedQuantity: number;
  totalAvailableQuantity: number;
  lowStockCount: number;
  overstockCount: number;
  outOfStockCount: number;
}

export interface LowStockReportItem {
  productId: number;
  sku?: string | null;
  productName: string;
  warehouseId: number;
  warehouseName?: string | null;
  availableQuantity: number;
  reorderLevel: number;
  shortageQuantity: number;
  severity: string;
}

export interface OverstockReportItem {
  productId: number;
  sku?: string | null;
  productName: string;
  warehouseId: number;
  warehouseName?: string | null;
  quantity: number;
  maxStockLevel: number;
  excessQuantity: number;
}

export interface StockMovementReportItem {
  movementId: number;
  movementNumber: string;
  productId: number;
  sku?: string | null;
  productName: string;
  warehouseId: number;
  warehouseName?: string | null;
  movementType: string;
  direction: string;
  quantity: number;
  unitCost: number;
  totalValue: number;
  referenceType?: string | null;
  referenceNumber?: string | null;
  performedBy?: number | null;
  movementDate: string;
}

export interface InventoryTurnoverReportResponse {
  productId: number;
  sku?: string | null;
  productName?: string | null;
  openingStock: number;
  closingStock: number;
  averageInventory: number;
  stockOutQuantity: number;
  turnoverRatio: number;
}

export interface TopMovingProductReportResponse {
  productId: number;
  sku?: string | null;
  productName?: string | null;
  totalMovementQuantity: number;
  movementCount: number;
  totalMovementValue: number;
}

export interface SlowMovingProductResponse {
  productId: number;
  sku?: string | null;
  productName?: string | null;
  lastMovementDate?: string | null;
  daysSinceLastMovement: number;
  currentQuantity: number;
  stockValue: number;
}

export interface DeadStockReportResponse {
  productId: number;
  sku?: string | null;
  productName?: string | null;
  warehouseId: number;
  warehouseName?: string | null;
  currentQuantity: number;
  stockValue: number;
  lastMovementDate?: string | null;
  daysWithoutMovement: number;
}

export interface PurchaseSummaryReportResponse {
  totalPurchaseOrders: number;
  pendingApprovalCount: number;
  approvedCount: number;
  receivedCount: number;
  cancelledCount: number;
  overdueCount: number;
  totalPurchaseValue: number;
  receivedPurchaseValue: number;
  pendingPurchaseValue: number;
}

export interface SupplierPerformanceReportResponse {
  supplierId: number;
  supplierName: string;
  totalOrders: number;
  receivedOrders: number;
  delayedOrders: number;
  totalSpend: number;
  averageLeadTimeDays: number;
  rating: number;
}

export interface SupplierPaymentItem {
  supplierId: number;
  supplierName: string;
  paidAmount: number;
  pendingAmount: number;
}

export interface PaymentSummaryReportResponse {
  totalPayments: number;
  paidCount: number;
  pendingCount: number;
  cancelledCount: number;
  totalPaidAmount: number;
  pendingAmount: number;
  supplierPayments: SupplierPaymentItem[];
}

export interface AlertSummaryReportResponse {
  totalAlerts: number;
  unreadAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  alertsByType: Record<string, number>;
}

export interface TrendPointResponse {
  date: string;
  value: number;
  direction: 'UP' | 'DOWN' | 'FLAT';
}

export interface DashboardAlertItem {
  alertId: number;
  title: string;
  severity: string;
  type: string;
  createdAt: string;
}

export interface ExecutiveDashboardReportResponse {
  totalProducts: number;
  totalWarehouses: number;
  totalInventoryValue: number;
  lowStockCount: number;
  overstockCount: number;
  pendingPurchaseApprovals: number;
  overduePurchaseOrders: number;
  totalPurchaseValue: number;
  totalPaidAmount: number;
  criticalAlerts: number;
  stockMovementToday: number;
  topMovingProducts: TopMovingProductReportResponse[];
  recentAlerts: DashboardAlertItem[];
  valuationTrend: TrendPointResponse[];
  purchaseTrend: TrendPointResponse[];
  unavailableSections: string[];
}

export interface InventorySnapshotResponse {
  snapshotId: number;
  snapshotDate: string;
  productId: number;
  productSku?: string | null;
  productName?: string | null;
  warehouseId: number;
  warehouseCode?: string | null;
  warehouseName?: string | null;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  unitCost: number;
  totalValue: number;
  createdAt?: string;
}

export interface PaymentOrderRequest {
  amount: number;
  currency: string;
  purchaseOrderId: number;
  userId: number;
  description?: string | null;
}

export interface PaymentOrderResponse {
  paymentId: number;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  status: string;
  description?: string | null;
  razorpayKeyId: string;
}

export interface PaymentVerificationRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface PaymentResponse {
  paymentId: number;
  razorpayOrderId: string;
  razorpayPaymentId?: string | null;
  purchaseOrderId: number;
  userId: number;
  amount: number;
  currency: string;
  status: string;
  description?: string | null;
  failureReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
