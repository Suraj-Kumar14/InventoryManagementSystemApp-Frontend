import {
  MovementDirection,
  MovementReasonCode,
  MovementSearchRequest,
  MovementType,
  ReferenceType,
} from '../../../core/http/backend.models';

export type MovementListQuery = MovementSearchRequest;

export const MOVEMENT_TYPE_OPTIONS: MovementType[] = [
  'STOCK_IN',
  'STOCK_OUT',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'ADJUSTMENT',
  'WRITE_OFF',
  'RETURN',
  'RESERVATION',
  'RESERVATION_RELEASE',
  'CYCLE_COUNT_CORRECTION',
  'REVERSAL',
];

export const MOVEMENT_DIRECTION_OPTIONS: MovementDirection[] = ['IN', 'OUT', 'NEUTRAL'];

export const REFERENCE_TYPE_OPTIONS: ReferenceType[] = [
  'PURCHASE_ORDER',
  'GRN',
  'SALES_ORDER',
  'TRANSFER',
  'ADJUSTMENT',
  'WRITE_OFF',
  'RETURN',
  'CYCLE_COUNT',
  'MANUAL_CORRECTION',
  'SYSTEM',
];

export const MOVEMENT_REASON_OPTIONS: MovementReasonCode[] = [
  'PURCHASE_RECEIPT',
  'STOCK_ISSUE',
  'TRANSFER_OUT',
  'TRANSFER_IN',
  'DAMAGED',
  'EXPIRED',
  'LOST',
  'FOUND',
  'COUNT_MISMATCH',
  'RETURNED',
  'MANUAL_CORRECTION',
  'SYSTEM_CORRECTION',
  'OTHER',
];
