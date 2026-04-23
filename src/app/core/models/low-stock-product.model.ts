export interface LowStockProduct {
  productId: number;
  id: number;
  sku: string;
  name: string;
  category: string;
  brand?: string;
  unitOfMeasure: string;
  reorderLevel: number;
  reorderPoint: number;
  currentQuantity: number;
  isActive: boolean;
  active: boolean;
  barcode?: string | null;
}
