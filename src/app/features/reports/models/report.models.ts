export type { ApiResponse, PagedResponse } from '../../../core/models';

export type ReportSortDirection = 'asc' | 'desc';
export type ReportFormat = 'CSV' | 'PDF' | 'EXCEL';

export interface ReportFilterRequest {
  warehouseId?: number | null;
  productId?: number | null;
  supplierId?: number | null;
  fromDate?: string | null;
  toDate?: string | null;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: ReportSortDirection;
  thresholdDays?: number | null;
}

export interface GenerateReportRequest {
  reportType: string;
  warehouseId?: number | null;
  productId?: number | null;
  supplierId?: number | null;
  fromDate?: string | null;
  toDate?: string | null;
  format: ReportFormat | string;
  requestedBy?: string | null;
  thresholdDays?: number | null;
}

export interface InventorySnapshotResponse {
  snapshotId: number;
  warehouseId: number;
  productId: number;
  quantity: number;
  stockValue: number;
  snapshotDate: string | null;
  createdAt: string | null;
}

export interface TotalStockValueResponse {
  totalStockValue: number;
  snapshotDate: string | null;
  totalProducts?: number;
  totalQuantity?: number;
  currency?: string | null;
}

export interface WarehouseStockValueResponse {
  warehouseId: number;
  warehouseName: string;
  totalStockValue: number;
  snapshotDate?: string | null;
  totalProducts?: number;
  totalQuantity?: number;
  percentageOfTotal?: number;
  utilizationPercent?: number;
}

export interface InventoryTurnoverResponse {
  productId: number;
  productName: string;
  turnoverRate: number;
  fromDate: string | null;
  toDate: string | null;
  warehouseId?: number | null;
  warehouseName?: string | null;
}

export interface LowStockReportResponse {
  productId: number;
  productName: string;
  warehouseId: number;
  availableQuantity: number;
  reorderLevel: number;
  warehouseName?: string | null;
  sku?: string | null;
}

export interface StockMovementSummaryResponse {
  productId: number;
  warehouseId: number;
  stockIn: number;
  stockOut: number;
  adjustment: number;
  transferIn: number;
  transferOut: number;
  fromDate: string | null;
  toDate: string | null;
  productName?: string | null;
  warehouseName?: string | null;
}

export interface TopMovingProductResponse {
  productId: number;
  productName: string;
  totalMovementQuantity: number;
  rank: number;
  sku?: string | null;
}

export interface SlowMovingProductResponse {
  productId: number;
  productName: string;
  totalMovementQuantity: number;
  lastMovementDate: string | null;
  sku?: string | null;
}

export interface DeadStockResponse {
  productId: number;
  productName: string;
  warehouseId: number;
  lastMovementDate: string | null;
  daysWithoutMovement: number;
  warehouseName?: string | null;
  sku?: string | null;
  quantity?: number;
  stockValue?: number;
}

export interface PurchaseOrderSummaryResponse {
  supplierId: number;
  warehouseId: number;
  totalPOs: number;
  totalSpend: number;
  fromDate: string | null;
  toDate: string | null;
  supplierName?: string | null;
  warehouseName?: string | null;
}

export interface GeneratedReportResponse {
  reportType: string;
  format: string;
  fileName: string;
  fileUrl: string;
  generatedAt: string | null;
}

export interface ReportDashboardSummary {
  snapshotDate: string | null;
  totalStockValue: number;
  lowStockCount: number;
  deadStockCount: number;
  totalPurchaseOrders: number;
  totalPurchaseSpend: number;
  warehouseCount: number;
  topWarehouse: WarehouseStockValueResponse | null;
}

export interface ReportNavigationItem {
  route: string;
  title: string;
  description: string;
  roles: string[];
  reportType?: string;
}

export interface ChartCardItem {
  label: string;
  value: number;
  secondary?: string;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}
