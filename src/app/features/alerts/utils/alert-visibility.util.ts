import { AlertResponse, AlertType } from '../../../core/http/backend.models';

export const USER_VISIBLE_ALERT_TYPES: AlertType[] = [
  'LOW_STOCK',
  'OVERSTOCK',
  'PO_APPROVAL_PENDING',
  'PO_OVERDUE_RECEIPT',
  'PAYMENT_PENDING',
  'PAYMENT_COMPLETED',
];

export function isUserVisibleAlertType(type: string | null | undefined): type is AlertType {
  return !!type && USER_VISIBLE_ALERT_TYPES.includes(type as AlertType);
}

export function filterVisibleAlerts<T extends Pick<AlertResponse, 'type'>>(alerts: T[]): T[] {
  return alerts.filter((alert) => isUserVisibleAlertType(alert.type));
}

export function resolveAlertWorkflowRoute(alert: Pick<AlertResponse, 'type' | 'actionUrl' | 'relatedProductId' | 'relatedPurchaseOrderId' | 'referenceId'>): string | null {
  if (alert.actionUrl?.trim()) {
    return alert.actionUrl;
  }

  const purchaseOrderId = alert.relatedPurchaseOrderId ?? toNumericId(alert.referenceId);
  const productId = alert.relatedProductId ?? toNumericId(alert.referenceId);

  switch (alert.type) {
    case 'LOW_STOCK':
    case 'OVERSTOCK':
      return productId ? `/products/${productId}` : '/reports/inventory/low-stock';
    case 'PO_APPROVAL_PENDING':
      return purchaseOrderId ? `/purchase-orders/${purchaseOrderId}` : '/purchase-orders/approvals';
    case 'PO_OVERDUE_RECEIPT':
      return purchaseOrderId ? `/purchase-orders/${purchaseOrderId}` : '/purchase-orders/overdue';
    case 'PAYMENT_PENDING':
      return '/payments';
    case 'PAYMENT_COMPLETED':
      return purchaseOrderId ? `/purchase-orders/${purchaseOrderId}` : '/payments';
    default:
      return null;
  }
}

function toNumericId(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
