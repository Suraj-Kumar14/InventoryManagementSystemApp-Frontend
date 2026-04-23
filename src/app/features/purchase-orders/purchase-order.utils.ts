import {
  POLineItem,
  PoStatus,
  Product,
  PurchaseOrder,
  Supplier,
  Warehouse
} from '../../core/models';

export interface PurchaseLookups {
  products?: Product[];
  suppliers?: Supplier[];
  warehouses?: Warehouse[];
}

export const PURCHASE_ORDER_STATUSES: PoStatus[] = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'PARTIALLY_RECEIVED',
  'FULLY_RECEIVED',
  'CANCELLED'
];

export function getPurchaseStatusLabel(status: PoStatus): string {
  switch (status) {
    case 'PENDING_APPROVAL':
      return 'Pending Approval';
    case 'PARTIALLY_RECEIVED':
      return 'Partially Received';
    case 'FULLY_RECEIVED':
      return 'Fully Received';
    default:
      return status.charAt(0) + status.slice(1).toLowerCase();
  }
}

export function getPurchaseStatusBadgeClass(status: PoStatus): string {
  switch (status) {
    case 'DRAFT':
      return 'badge-gray';
    case 'PENDING_APPROVAL':
      return 'badge-warning';
    case 'APPROVED':
      return 'badge-primary';
    case 'PARTIALLY_RECEIVED':
      return 'badge-warning';
    case 'FULLY_RECEIVED':
      return 'badge-success';
    case 'CANCELLED':
      return 'badge-danger';
    default:
      return 'badge-gray';
  }
}

export function canApprovePurchaseOrder(order: PurchaseOrder): boolean {
  return order.status === 'DRAFT' || order.status === 'PENDING_APPROVAL';
}

export function canCancelPurchaseOrder(order: PurchaseOrder): boolean {
  return (
    order.status === 'DRAFT' ||
    order.status === 'PENDING_APPROVAL' ||
    order.status === 'APPROVED'
  );
}

export function canReceivePurchaseOrder(order: PurchaseOrder): boolean {
  return order.status === 'APPROVED' || order.status === 'PARTIALLY_RECEIVED';
}

export function canEditPurchaseOrder(order: PurchaseOrder): boolean {
  return order.status === 'DRAFT';
}

export function getRemainingQuantity(item: POLineItem): number {
  return Math.max(Number(item.quantity ?? item.orderedQuantity ?? 0) - Number(item.receivedQty ?? item.receivedQuantity ?? 0), 0);
}

export function getReceiptProgress(order: PurchaseOrder): number {
  const totalOrdered = order.lineItems.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
  const totalReceived = order.lineItems.reduce((sum, item) => sum + Number(item.receivedQty ?? 0), 0);

  if (totalOrdered <= 0) {
    return 0;
  }

  return Math.min((totalReceived / totalOrdered) * 100, 100);
}

export function enrichPurchaseOrders(
  orders: PurchaseOrder[],
  lookups: PurchaseLookups
): PurchaseOrder[] {
  return orders.map((order) => enrichPurchaseOrder(order, lookups));
}

export function enrichPurchaseOrder(
  order: PurchaseOrder,
  lookups: PurchaseLookups
): PurchaseOrder {
  const supplier = lookups.suppliers?.find((candidate) => candidate.id === order.supplierId);
  const warehouse = lookups.warehouses?.find((candidate) => candidate.id === order.warehouseId);

  const lineItems = order.lineItems.map((lineItem) => {
    const product = lookups.products?.find((candidate) => candidate.id === lineItem.productId);
    const quantity = Number(lineItem.quantity ?? lineItem.orderedQuantity ?? 0);
    const receivedQty = Number(lineItem.receivedQty ?? lineItem.receivedQuantity ?? 0);
    const unitCost = Number(lineItem.unitCost ?? lineItem.unitPrice ?? product?.costPrice ?? 0);
    const totalCost = Number(lineItem.totalCost ?? lineItem.totalPrice ?? quantity * unitCost);

    return {
      ...lineItem,
      productName: lineItem.productName ?? product?.name ?? `Product #${lineItem.productId}`,
      sku: lineItem.sku ?? product?.sku ?? '-',
      quantity,
      orderedQuantity: quantity,
      unitCost,
      unitPrice: unitCost,
      totalCost,
      totalPrice: totalCost,
      receivedQty,
      receivedQuantity: receivedQty,
      remainingQty: getRemainingQuantity({
        ...lineItem,
        quantity,
        orderedQuantity: quantity,
        receivedQty,
        receivedQuantity: receivedQty,
        unitCost,
        unitPrice: unitCost,
        totalCost,
        totalPrice: totalCost
      } as POLineItem)
    } satisfies POLineItem;
  });

  const receivedPercent = getReceiptProgress({ ...order, lineItems, items: lineItems });

  return {
    ...order,
    supplierName: order.supplierName ?? supplier?.name ?? `Supplier #${order.supplierId}`,
    warehouseName: order.warehouseName ?? warehouse?.name ?? `Warehouse #${order.warehouseId}`,
    lineItems,
    items: lineItems,
    receivedPercent
  };
}
