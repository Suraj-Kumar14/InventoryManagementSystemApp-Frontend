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

export type PoStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'RECEIVED' | 'CANCELLED' | 'REJECTED';

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  supplierId: number;
  supplierName: string;
  warehouseId: number;
  warehouseName: string;
  status: PoStatus;
  totalAmount: number;
  items: PurchaseOrderItem[];
  expectedDeliveryDate?: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id?: number;
  productId: number;
  productName?: string;
  sku?: string;
  orderedQuantity: number;
  receivedQuantity?: number;
  unitPrice: number;
  totalPrice?: number;
}

export interface CreatePoRequest {
  supplierId: number;
  warehouseId: number;
  expectedDeliveryDate?: string;
  notes?: string;
  items: { productId: number; orderedQuantity: number; unitPrice: number }[];
}

// ── Suppliers ─────────────────────────────────────────────────────────────────

export type SupplierStatus = 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED';

export interface Supplier {
  id: number;
  name: string;
  code: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  taxId?: string;
  rating: number;
  active: boolean;
  status: SupplierStatus;
  totalOrders: number;
  totalOrderValue: number;
  createdAt: string;
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

export interface DashboardKpi {
  asOfDate: string;
  totalStockValue: number;
  totalProducts: number;
  totalWarehouses: number;
  lowStockItems: number;
  deadStockItems: number;
  overstockItems: number;
  totalMovements30d: number;
  totalInboundQty30d: number;
  totalOutboundQty30d: number;
  openPurchaseOrders: number;
  pendingApprovalOrders: number;
  overdueOrders: number;
  stockValueChangePercent: number;
  turnoverRateAvg: number;
}

export interface LowStockReport {
  productId: number;
  productName: string;
  sku: string;
  warehouseId: number;
  warehouseName: string;
  currentQuantity: number;
  reorderPoint: number;
  shortage: number;
  estimatedCost: number;
  stockoutRisk: boolean;
}

export interface TopMovingProduct {
  rank: number;
  productId: number;
  productName: string;
  sku: string;
  category: string;
  totalOutboundQty: number;
  totalOutboundValue: number;
  totalMovements: number;
  // Aliases used in templates
  totalQuantity: number;
  totalValue: number;
}

export interface DeadStockItem {
  productId: number;
  productName: string;
  sku: string;
  warehouseId: number;
  warehouseName: string;
  currentQuantity: number;
  stockValue: number;
  lastMovementDate: string;
  daysSinceLastMovement: number;
  thresholdDays: number;
}

export interface TotalStockValue {
  asOfDate: string;
  warehouseId?: number;
  totalProducts: number;
  totalQuantity: number;
  totalStockValue: number;
  currency: string;
}

export interface WarehouseStockValue {
  warehouseId: number;
  warehouseName: string;
  asOfDate: string;
  totalProducts: number;
  totalQuantity: number;
  stockValue: number;
  totalStockValue: number;
  percentageOfTotal: number;
  utilizationPercent: number;
}
