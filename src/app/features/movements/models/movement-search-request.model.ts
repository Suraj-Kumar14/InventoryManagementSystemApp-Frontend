import { MovementType } from './stock-movement.model';

export type MovementSortDirection = 'asc' | 'desc';

export interface MovementSearchRequest {
  page?: number;
  size?: number;
  productId?: number | null;
  warehouseId?: number | null;
  movementType?: MovementType | '' | null;
  referenceId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortDirection?: MovementSortDirection;
}
