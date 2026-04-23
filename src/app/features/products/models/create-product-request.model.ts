export interface CreateProductRequest {
  sku: string;
  name: string;
  description?: string | null;
  category: string;
  brand: string;
  unitOfMeasure: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  maxStockLevel: number;
  leadTimeDays: number;
  imageUrl?: string | null;
  isActive?: boolean;
  barcode?: string | null;
}
