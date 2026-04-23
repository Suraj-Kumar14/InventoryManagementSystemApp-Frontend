export interface Product {
  productId: number;
  id: number;
  sku: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  unitOfMeasure: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  reorderPoint: number;
  maxStockLevel?: number | null;
  leadTimeDays?: number | null;
  imageUrl?: string | null;
  isActive: boolean;
  active: boolean;
  barcode?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
