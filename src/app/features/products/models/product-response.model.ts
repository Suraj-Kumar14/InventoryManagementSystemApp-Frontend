export interface ProductResponse {
  productId?: number;
  id?: number;
  sku?: string;
  name?: string;
  description?: string | null;
  category?: string;
  brand?: string | null;
  unitOfMeasure?: string;
  costPrice?: number | string | null;
  sellingPrice?: number | string | null;
  reorderLevel?: number | string | null;
  reorderPoint?: number | string | null;
  maxStockLevel?: number | string | null;
  leadTimeDays?: number | string | null;
  imageUrl?: string | null;
  isActive?: boolean | string | null;
  active?: boolean | string | null;
  barcode?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}
