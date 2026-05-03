import { AlertSeverity, AlertType } from '../../../core/http/backend.models';

export type WarehouseStaffDashboardSectionKey =
  | 'dashboard'
  | 'assignedWarehouse'
  | 'stock'
  | 'receipts'
  | 'transfers'
  | 'movements'
  | 'alerts';

export interface WarehouseStaffDashboardResponse {
  assignedWarehouseId: number | null;
  assignedWarehouseName: string | null;
  assignedWarehouseCode: string | null;
  stockItemCount: number;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  lowStockCount: number;
  outOfStockCount: number;
  goodsReceiptsPending: number;
  partiallyReceivedOrders: number;
  overdueReceipts: number;
  stockMovementsToday: number;
  stockInToday: number;
  stockOutToday: number;
  transfersPending: number | null;
  incomingTransfersPending: number | null;
  outgoingTransfersPending: number | null;
  cycleCountsPending: number | null;
  adjustmentsToday: number;
  writeOffsToday: number;
  unreadAlerts: number;
  criticalAlerts: number;
}

export interface KpiCard {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  trendValue?: string;
  trendDirection?: 'up' | 'down' | 'flat';
  route?: string;
  severity?: 'default' | 'warning' | 'critical' | 'success';
}

export interface AssignedStockItem {
  productId: number;
  sku: string;
  productName: string;
  availableQuantity: number;
  reservedQuantity: number;
  reorderLevel: number;
  stockStatus: string;
  route: string;
}

export interface PendingReceiptItem {
  purchaseOrderId: number;
  poNumber: string;
  supplierName: string;
  expectedDeliveryDate: string | null;
  status: string;
  totalItems: number;
  route: string;
}

export interface TransferTaskItem {
  transferId: number;
  transferNumber: string;
  sourceWarehouseName: string;
  destinationWarehouseName: string;
  status: string;
  productName: string;
  quantity: number;
  route: string;
}

export interface RecentMovement {
  movementId: number;
  movementNumber: string;
  productName: string;
  warehouseName: string;
  movementType: string;
  quantity: number;
  movementDate: string | null;
  route: string;
}

export interface RecentAlert {
  alertId: number;
  title: string;
  severity: AlertSeverity;
  type: AlertType;
  createdAt: string | null;
  route: string;
  isAcknowledged: boolean;
  isDismissed: boolean;
}

export interface WarehouseStaffDashboardView {
  overview: WarehouseStaffDashboardResponse | null;
  kpis: KpiCard[];
  assignedStockItems: AssignedStockItem[];
  pendingReceipts: PendingReceiptItem[];
  pendingTransfers: TransferTaskItem[];
  recentMovements: RecentMovement[];
  recentAlerts: RecentAlert[];
  sectionErrors: Partial<Record<WarehouseStaffDashboardSectionKey, string>>;
  sectionNotices: Partial<Record<WarehouseStaffDashboardSectionKey, string>>;
  loadedAt: string;
}
