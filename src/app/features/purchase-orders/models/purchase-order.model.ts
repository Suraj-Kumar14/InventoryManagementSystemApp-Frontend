export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'PAYMENT_INITIATED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PAID'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CANCELLED'
  | 'REJECTED';

export interface PurchaseOrderListQuery {
  keyword?: string;
  supplierId?: number | null;
  warehouseId?: number | null;
  status?: PurchaseOrderStatus | null;
  createdBy?: number | null;
  fromDate?: string | null;
  toDate?: string | null;
  overdueOnly?: boolean | null;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface PurchaseOrderLineDraft {
  productId: number;
  orderedQuantity: number;
  unitCost: number;
  notes?: string | null;
}

export interface PurchaseOrderFormValue {
  supplierId: number;
  warehouseId: number;
  expectedDeliveryDate: string;
  paymentTerms?: string | null;
  notes?: string | null;
  taxAmount?: number | null;
  discountAmount?: number | null;
  shippingAmount?: number | null;
  lineItems: PurchaseOrderLineDraft[];
}
