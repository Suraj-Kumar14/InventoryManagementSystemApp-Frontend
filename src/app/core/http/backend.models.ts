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

export interface ProductRequest {
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

export interface ProductResponse {
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

export interface SupplierRequest {
  name: string;
  contactPerson?: string | null;
  email: string;
  phone?: string | null;
  address?: string | null;
  city: string;
  country: string;
  taxId?: string | null;
  paymentTerms?: string | null;
  leadTimeDays: number;
}

export interface SupplierResponse {
  supplierId: number;
  name: string;
  contactPerson?: string | null;
  email: string;
  phone?: string | null;
  address?: string | null;
  city: string;
  country: string;
  taxId?: string | null;
  paymentTerms?: string | null;
  leadTimeDays: number;
  rating?: number | null;
  totalOrders?: number | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface WarehouseRequest {
  name: string;
  location: string;
  address?: string | null;
  managerId?: number | null;
  capacity: number;
  phone?: string | null;
}

export interface WarehouseResponse {
  warehouseId: number;
  name: string;
  location: string;
  address?: string | null;
  managerId?: number | null;
  capacity: number;
  usedCapacity?: number | null;
  phone?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface StockLevelResponse {
  stockId: number;
  warehouseId: number;
  productId: number;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  binLocation?: string | null;
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
  productId: number;
  quantity: number;
  binLocation?: string | null;
  reorderLevel?: number | null;
  maxStockLevel?: number | null;
}

export interface StockTransferRequest {
  fromWarehouseId: number;
  toWarehouseId: number;
  productId: number;
  quantity: number;
  reason: string;
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
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQty: number;
}

export interface PurchaseOrderResponse {
  poId: number;
  supplierId: number;
  warehouseId: number;
  createdById: number;
  status: string;
  totalAmount: number;
  orderDate?: string;
  expectedDate?: string | null;
  receivedDate?: string | null;
  notes?: string | null;
  referenceNumber?: string | null;
  createdAt?: string;
  lineItems: PurchaseOrderLineItemResponse[];
}

export interface GoodsReceiptRequest {
  lineItemId: number;
  receivedQty: number;
}

export interface StockMovementRequest {
  productId: number;
  warehouseId: number;
  movementType: string;
  quantity: number;
  referenceId?: number | null;
  referenceType?: string | null;
  unitCost?: number | null;
  performedBy: number;
  notes?: string | null;
  balanceAfter: number;
}

export interface StockMovementResponse {
  movementId: number;
  productId: number;
  warehouseId: number;
  movementType: string;
  quantity: number;
  referenceId?: number | null;
  referenceType?: string | null;
  unitCost?: number | null;
  performedBy: number;
  notes?: string | null;
  movementDate?: string;
  balanceAfter: number;
}

export interface AlertRequest {
  recipientId: number;
  type: string;
  severity: string;
  title: string;
  message: string;
  relatedProductId?: number | null;
  relatedWarehouseId?: number | null;
  relatedPurchaseOrderId?: number | null;
  channel?: string | null;
}

export interface AlertResponse {
  alertId: number;
  recipientId: number;
  type: string;
  severity: string;
  title: string;
  message: string;
  relatedProductId?: number | null;
  relatedWarehouseId?: number | null;
  relatedPurchaseOrderId?: number | null;
  channel?: string | null;
  isRead: boolean;
  isAcknowledged: boolean;
  readAt?: string | null;
  acknowledgedAt?: string | null;
  createdAt?: string;
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
  startInventoryValue: number;
  endInventoryValue: number;
  averageInventoryValue: number;
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
