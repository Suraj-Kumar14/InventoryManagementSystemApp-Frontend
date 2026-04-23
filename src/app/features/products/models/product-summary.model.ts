export interface ProductSummary {
  productId: number;
  sku: string;
  name: string;
  category: string;
  brand: string;
  unitOfMeasure: string;
  sellingPrice: number | null;
  reorderLevel: number;
  maxStockLevel: number | null;
  barcode: string | null;
  imageUrl: string | null;
  isActive: boolean;
  currentQuantity?: number | null;
}
