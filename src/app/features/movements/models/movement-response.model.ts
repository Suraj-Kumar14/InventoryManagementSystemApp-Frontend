import { MovementType } from './stock-movement.model';

export interface MovementResponse {
  movementId?: number | string | null;
  id?: number | string | null;
  productId?: number | string | null;
  productName?: string | null;
  sku?: string | null;
  warehouseId?: number | string | null;
  warehouseName?: string | null;
  movementType?: MovementType | 'TRANSFER' | string | null;
  quantity?: number | string | null;
  referenceId?: string | number | null;
  referenceType?: string | null;
  unitCost?: number | string | null;
  performedBy?: string | null;
  performedByName?: string | null;
  createdBy?: string | null;
  createdByName?: string | null;
  notes?: string | null;
  movementDate?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  balanceAfter?: number | string | null;
}
