import { AlertResponse, AlertStatus } from '../../../core/http/backend.models';

const MAX_ALERT_PREVIEW_LENGTH = 180;
const DEFAULT_ALERT_DETAIL_LENGTH = 320;

export function getAlertDisplayMessage(alert: Pick<AlertResponse, 'message' | 'userMessage'>): string {
  return alert.userMessage?.trim() || alert.message?.trim() || '';
}

export function truncateAlertMessage(message: string, maxLength = MAX_ALERT_PREVIEW_LENGTH): string {
  const normalized = message.trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

export function getAlertDetailMessage(alert: Pick<AlertResponse, 'message' | 'userMessage'>): string {
  return truncateAlertMessage(getAlertDisplayMessage(alert), DEFAULT_ALERT_DETAIL_LENGTH);
}

export function canAcknowledgeAlert(
  alert: Pick<AlertResponse, 'status' | 'isAcknowledged' | 'isDismissed'>
): boolean {
  if (alert.isDismissed || alert.status === 'DISMISSED') {
    return false;
  }
  if (alert.isAcknowledged || alert.status === 'ACKNOWLEDGED') {
    return false;
  }
  return alert.status === 'NEW' || alert.status === 'READ';
}

export function canDismissAlert(
  alert: Pick<AlertResponse, 'status' | 'isDismissed'>
): boolean {
  return !(alert.isDismissed || alert.status === 'DISMISSED');
}

export function canResolveAlert(status: AlertStatus): boolean {
  return status !== 'RESOLVED' && status !== 'DISMISSED';
}
