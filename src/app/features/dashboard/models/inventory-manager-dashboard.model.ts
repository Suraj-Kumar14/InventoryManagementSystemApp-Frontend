import {
  AlertResponse,
  AlertSummaryResponse,
  ExecutiveDashboardReportResponse,
  MovementResponse,
  MovementSummaryResponse,
  Product,
  ProductSummary,
  StockSummaryResponse,
  WarehouseSummaryResponse,
} from '../../../core/http/backend.models';

export type InventoryManagerDashboardSectionKey =
  | 'dashboard'
  | 'stock'
  | 'products'
  | 'warehouse'
  | 'purchase'
  | 'movement'
  | 'alerts';

export interface InventoryManagerDashboardResponse {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  totalWarehouses: number;
  totalInventoryValue: number;
  totalStockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockCount: number;
  overstockCount: number;
  outOfStockCount: number;
  pendingPurchaseApprovals: number;
  overduePurchaseOrders: number;
  approvedAwaitingReceipt: number;
  stockMovementToday: number;
  adjustmentCountToday: number;
  writeOffCountToday: number;
  unreadAlerts: number;
  criticalAlerts: number;
}

export interface InventoryManagerKpiCard {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  route?: string;
  severity?: 'default' | 'warning' | 'critical' | 'success';
}

export interface RecentMovement {
  movementId: number;
  movementNumber: string;
  productName: string;
  warehouseName: string;
  movementType: string;
  quantity: number;
  movementDate?: string;
  route: string;
}

export interface RecentAlert {
  alertId: number;
  title: string;
  severity: string;
  type: string;
  createdAt?: string;
  route: string;
  isAcknowledged: boolean;
}

export interface WarehouseUtilization {
  warehouseId: number;
  warehouseName: string;
  capacity: number;
  usedCapacity: number;
  utilizationPercent: number;
  route: string;
}

export interface InventoryManagerInventorySummary {
  totalInventoryValue: number;
  totalStockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockCount: number;
  overstockCount: number;
  outOfStockCount: number;
}

export interface InventoryManagerPurchaseSummary {
  pendingPurchaseApprovals: number;
  overduePurchaseOrders: number;
  approvedAwaitingReceipt: number;
}

export interface InventoryManagerDashboardView {
  roleDashboard: ExecutiveDashboardReportResponse | null;
  overview: InventoryManagerDashboardResponse | null;
  productSummary: ProductSummary | null;
  inventorySummary: InventoryManagerInventorySummary | null;
  warehouseSummary: WarehouseSummaryResponse | null;
  stockSummary: StockSummaryResponse | null;
  purchaseSummary: InventoryManagerPurchaseSummary | null;
  movementSummary: MovementSummaryResponse | null;
  alertSummary: AlertSummaryResponse | null;
  recentAlerts: AlertResponse[];
  recentMovements: RecentMovement[];
  recentProducts: Product[];
  warehouseUtilization: WarehouseUtilization[];
  sectionErrors: Partial<Record<InventoryManagerDashboardSectionKey, string>>;
  generatedAt: string;
}
