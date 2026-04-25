// ── Common ────────────────────────────────────────────────────────────────────

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface MessageResponse {
  message: string;
}

export interface ErrorResponse {
  status: number;
  errorCode: string;
  message: string;
  fieldErrors?: { [key: string]: string };
  timestamp: string;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export type UserRole = 'ROLE_ADMIN' | 'ROLE_INVENTORY_MANAGER' | 'ROLE_WAREHOUSE_STAFF' | 'ROLE_PURCHASE_OFFICER';

export interface User {
  id?: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  role?: UserRole | string;
  active?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  avatarUrl?: string;
  phone?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  department?: string;
}

// ── Products ──────────────────────────────────────────────────────────────────

export * from './product.model';
export * from './product-request.model';
export * from './low-stock-product.model';

// ── Warehouses ────────────────────────────────────────────────────────────────

export interface Warehouse {
  warehouseId: number;
  id: number;
  name: string;
  location: string;
  address: string;
  managerId?: number | null;
  capacity: number;
  usedCapacity: number;
  currentUtilization: number;
  utilizationPercent: number;
  isActive: boolean;
  active: boolean;
  phone?: string | null;
  createdAt?: string;
  updatedAt?: string;

  // Compatibility fields used by older templates.
  code: string;
  managerName?: string;
  city?: string;
  country?: string;
}

export interface CreateWarehouseRequest {
  name: string;
  location: string;
  address: string;
  managerId?: number | null;
  capacity: number;
  phone?: string | null;
}

export interface UpdateWarehouseRequest extends CreateWarehouseRequest {
  isActive?: boolean;
}

export interface WarehouseSummaryResponse {
  warehouseId: number;
  id: number;
  name: string;
  location: string;
  isActive: boolean;
  active: boolean;
}

export interface WarehouseUtilizationResponse {
  warehouseId: number;
  capacity: number;
  usedCapacity: number;
  utilizationPercentage: number;
}

// ── Stock ─────────────────────────────────────────────────────────────────────

export interface StockLevel {
  stockId: number;
  id: number;
  warehouseId: number;
  productId: number;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  location?: string | null;
  lastUpdated: string;
  createdAt?: string;
  updatedAt?: string;

  // Optional client-side enrichment fields.
  productName?: string;
  sku?: string;
  warehouseName?: string;
  reorderLevel?: number;
  reorderPoint?: number;
  stockValue?: number;
}

export interface StockTransferRequest {
  sourceWarehouseId: number;
  destinationWarehouseId: number;
  productId: number;
  quantity: number;
  referenceId?: string | null;
  referenceType?: string | null;
  unitCost?: number | null;
  notes?: string | null;
}

export interface StockAdjustRequest {
  productId: number;
  warehouseId: number;
  newQuantity: number;
  reason: string;
  adjustmentType: 'INCREASE' | 'DECREASE' | 'SET';
  referenceId?: string | null;
  unitCost?: number | null;
}

export interface UpdateStockRequest {
  warehouseId: number;
  productId: number;
  quantity: number;
  unitCost?: number | null;
  referenceId?: string | null;
  referenceType?: string | null;
  notes?: string | null;
}

export interface ReserveStockRequest {
  warehouseId: number;
  productId: number;
  quantity: number;
  referenceId?: string | null;
  referenceType?: string | null;
  notes?: string | null;
}

export interface ReleaseReservationRequest {
  warehouseId: number;
  productId: number;
  quantity: number;
  referenceId?: string | null;
  referenceType?: string | null;
  notes?: string | null;
}

export interface TransferStockResponse {
  productId: number;
  sourceWarehouseId: number;
  destinationWarehouseId: number;
  transferredQuantity: number;
  sourceBalance: number;
  destinationBalance: number;
  message: string;
}

export interface LowStockItem {
  warehouseId: number;
  productId: number;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  location?: string | null;

  // Optional client-side enrichment fields.
  productName?: string;
  sku?: string;
  warehouseName?: string;
  reorderLevel?: number;
  reorderPoint?: number;
}

// ── Movements ─────────────────────────────────────────────────────────────────

export type MovementType = 'STOCK_IN' | 'STOCK_OUT' | 'TRANSFER' | 'ADJUSTMENT' | 'RETURN';

export interface StockMovement {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  warehouseId: number;
  warehouseName: string;
  movementType: MovementType;
  quantity: number;
  referenceType?: string;
  referenceId?: number;
  notes?: string;
  performedBy: string;
  createdAt: string;
}

// ── Purchase Orders ───────────────────────────────────────────────────────────

export type PoStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PARTIALLY_RECEIVED'
  | 'FULLY_RECEIVED'
  | 'CANCELLED';

export interface POLineItem {
  lineItemId?: number;
  id?: number;
  poId?: number;
  productId: number;
  productName?: string;
  sku?: string;
  quantity: number;
  orderedQuantity: number;
  unitCost: number;
  unitPrice: number;
  totalCost: number;
  totalPrice: number;
  receivedQty: number;
  receivedQuantity: number;
  remainingQty: number;
}

export interface PurchaseOrder {
  poId: number;
  id: number;
  supplierId: number;
  supplierName?: string;
  warehouseId: number;
  warehouseName?: string;
  createdById: number;
  createdBy?: string;
  status: PoStatus;
  totalAmount: number;
  orderDate: string;
  expectedDate?: string | null;
  expectedDeliveryDate?: string | null;
  receivedDate?: string | null;
  notes?: string | null;
  referenceNumber?: string | null;
  poNumber: string;
  lineItems: POLineItem[];
  items: POLineItem[];
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  receivedPercent: number;
}

export interface CreatePurchaseOrderRequest {
  supplierId: number;
  warehouseId: number;
  createdById?: number | null;
  status?: 'DRAFT' | 'PENDING_APPROVAL';
  orderDate?: string | null;
  expectedDate?: string | null;
  notes?: string | null;
  referenceNumber?: string | null;
  lineItems: Array<{
    productId: number;
    quantity: number;
    unitCost: number;
    totalCost?: number;
    receivedQty?: number;
  }>;
}

export interface UpdatePurchaseOrderRequest extends CreatePurchaseOrderRequest {}

export interface ReceiveGoodsRequest {
  items: Array<{
    lineItemId?: number;
    productId?: number;
    receivedQty: number;
  }>;
}

export interface PurchaseOrderFilter {
  page?: number;
  size?: number;
  status?: PoStatus | 'ALL' | '';
  supplierId?: number | null;
  warehouseId?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  referenceNumber?: string;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export type PurchaseOrderItem = POLineItem;
export type CreatePoRequest = CreatePurchaseOrderRequest;

// ── Suppliers ─────────────────────────────────────────────────────────────────

export type SupplierStatus = 'ACTIVE' | 'INACTIVE';

export interface Supplier {
  supplierId: number;
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  city: string;
  country: string;
  taxId: string;
  paymentTerms: string;
  leadTimeDays: number;
  rating: number;
  isActive: boolean;
  active: boolean;
  createdAt?: string;

  // Compatibility fields used by older templates.
  code?: string;
  status: SupplierStatus;
  totalOrders?: number;
  totalOrderValue?: number;
}

export interface CreateSupplierRequest {
  name: string;
  contactPerson: string;
  email: string;
  phone?: string | null;
  address: string;
  city: string;
  country: string;
  taxId: string;
  paymentTerms: string;
  leadTimeDays: number;
}

export interface UpdateSupplierRequest extends CreateSupplierRequest {
  isActive?: boolean;
  rating?: number | null;
}

export interface UpdateSupplierRatingRequest {
  newRating: number;
}

export interface SupplierFilter {
  page?: number;
  size?: number;
  search?: string;
  city?: string;
  country?: string;
  isActive?: boolean | '' | null;
  sortBy?: 'name' | 'city' | 'country' | 'rating' | 'leadTimeDays' | 'createdAt';
  sortDir?: 'asc' | 'desc';
}

// ── Alerts ────────────────────────────────────────────────────────────────────

export type AlertType = 'LOW_STOCK' | 'OVERSTOCK' | 'PO_PENDING' | 'OVERDUE_RECEIPT' | 'SYSTEM';
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Alert {
  id: number;
  recipientId: number;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  isRead: boolean;
  isAcknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  relatedProductId?: number;
  relatedWarehouseId?: number;
  actionUrl?: string;
  createdAt: string;
}

export interface UnreadCountResponse {
  unreadCount: number;
  recipientId: number;
}

// ── Reports ───────────────────────────────────────────────────────────────────
