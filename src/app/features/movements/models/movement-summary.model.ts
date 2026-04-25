export interface MovementSummary {
  totalMovements: number;
  totalQuantity: number;
  stockInTotal: number;
  stockOutTotal: number;
  transferInTotal: number;
  transferOutTotal: number;
  adjustmentTotal: number;
  writeOffTotal: number;
  returnTotal: number;
  latestMovementDate: string | null;
}
