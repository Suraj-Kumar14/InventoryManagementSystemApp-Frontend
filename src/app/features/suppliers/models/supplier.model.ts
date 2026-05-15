export type SupplierSortField =
  | 'name'
  | 'supplierCode'
  | 'city'
  | 'country'
  | 'leadTimeDays'
  | 'rating'
  | 'createdAt';

export interface SupplierListQuery {
  keyword?: string;
  status?: string | null;
  isActive?: boolean | null;
  city?: string;
  country?: string;
  minRating?: number | null;
  maxLeadTimeDays?: number | null;
  page?: number;
  size?: number;
  sortBy?: SupplierSortField;
  sortDir?: 'asc' | 'desc';
}
