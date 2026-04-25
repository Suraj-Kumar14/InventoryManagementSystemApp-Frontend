export type MovementType =
  | 'STOCK_IN'
  | 'STOCK_OUT'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'ADJUSTMENT'
  | 'WRITE_OFF'
  | 'RETURN';

export interface StockMovement {
  movementId: number;
  id: number;
  productId: number;
  productName?: string | null;
  sku?: string | null;
  warehouseId: number;
  warehouseName?: string | null;
  movementType: MovementType;
  quantity: number;
  referenceId: string | null;
  referenceType: string | null;
  unitCost: number | null;
  performedBy: string;
  notes: string | null;
  movementDate: string;
  balanceAfter: number;
}
