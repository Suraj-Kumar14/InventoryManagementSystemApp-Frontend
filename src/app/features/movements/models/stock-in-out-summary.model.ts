export interface StockInOutSummary {
  productId: number;
  totalStockIn: number;
  totalStockOut: number;
  netMovement: number;
  movementCount: number;
  lastMovementDate: string | null;
}
