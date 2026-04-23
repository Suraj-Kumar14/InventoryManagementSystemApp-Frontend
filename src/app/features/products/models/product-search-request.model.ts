export type ProductSortDirection = 'asc' | 'desc';
export type ProductStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

export interface ProductSearchRequest {
  page?: number;
  size?: number;
  searchText?: string;
  sku?: string;
  barcode?: string;
  category?: string;
  brand?: string;
  isActive?: boolean | null;
  sortBy?: string;
  sortDirection?: ProductSortDirection;
}
