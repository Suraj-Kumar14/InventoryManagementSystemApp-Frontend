export interface ProductRequest {
  sku: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  unitOfMeasure: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  maxStockLevel?: number | null;
  leadTimeDays?: number | null;
  imageUrl?: string | null;
  isActive: boolean;
  barcode?: string | null;
}
