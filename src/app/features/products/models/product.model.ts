export type {
  CreateProductRequest,
  PageResponse,
  Product,
  ProductSummary,
  UpdateProductRequest,
} from '../../../core/http/backend.models';

export type SortDirection = 'asc' | 'desc';

export interface ProductListQuery {
  keyword?: string;
  category?: string;
  brand?: string;
  isActive?: boolean | undefined;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: SortDirection;
}
