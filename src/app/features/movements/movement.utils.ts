import {
  MovementSummary,
  MovementType,
  StockInOutSummary,
  StockMovement
} from './models';

export const MOVEMENT_TYPES: MovementType[] = [
  'STOCK_IN',
  'STOCK_OUT',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'ADJUSTMENT',
  'WRITE_OFF',
  'RETURN'
];

const INBOUND_MOVEMENT_TYPES: MovementType[] = ['STOCK_IN', 'TRANSFER_IN', 'RETURN'];
const OUTBOUND_MOVEMENT_TYPES: MovementType[] = ['STOCK_OUT', 'TRANSFER_OUT', 'WRITE_OFF'];

export function formatMovementType(type: MovementType): string {
  return type.replace(/_/g, ' ');
}

export function getMovementBadgeClass(type: MovementType): string {
  switch (type) {
    case 'STOCK_IN':
      return 'badge-success';
    case 'STOCK_OUT':
      return 'badge-danger';
    case 'TRANSFER_IN':
      return 'badge-info';
    case 'TRANSFER_OUT':
      return 'badge-primary';
    case 'ADJUSTMENT':
      return 'badge-warning';
    case 'WRITE_OFF':
      return 'badge-gray';
    case 'RETURN':
      return 'badge-success';
    default:
      return 'badge-gray';
  }
}

export function isInboundMovement(type: MovementType): boolean {
  return INBOUND_MOVEMENT_TYPES.includes(type);
}

export function isOutboundMovement(type: MovementType): boolean {
  return OUTBOUND_MOVEMENT_TYPES.includes(type);
}

export function getSignedMovementQuantity(movement: StockMovement): number {
  if (isInboundMovement(movement.movementType)) {
    return Math.abs(movement.quantity);
  }

  if (isOutboundMovement(movement.movementType)) {
    return -Math.abs(movement.quantity);
  }

  return movement.quantity;
}

export function formatSignedMovementQuantity(movement: StockMovement): string {
  const signedQuantity = getSignedMovementQuantity(movement);

  if (signedQuantity > 0) {
    return `+${signedQuantity}`;
  }

  if (signedQuantity < 0) {
    return `${signedQuantity}`;
  }

  return String(movement.quantity);
}

export function getSignedMovementQuantityClass(movement: StockMovement): string {
  const signedQuantity = getSignedMovementQuantity(movement);

  if (signedQuantity > 0) {
    return 'qty-positive';
  }

  if (signedQuantity < 0) {
    return 'qty-negative';
  }

  return 'qty-neutral';
}

export function sortMovementsByDate(
  movements: StockMovement[],
  direction: 'asc' | 'desc' = 'desc'
): StockMovement[] {
  const factor = direction === 'asc' ? 1 : -1;

  return [...movements].sort((left, right) => {
    const leftTime = left.movementDate ? new Date(left.movementDate).getTime() : 0;
    const rightTime = right.movementDate ? new Date(right.movementDate).getTime() : 0;

    return (leftTime - rightTime) * factor;
  });
}

export function buildMovementSummary(movements: StockMovement[]): MovementSummary {
  const latestMovement = sortMovementsByDate(movements, 'desc')[0] ?? null;

  return movements.reduce<MovementSummary>(
    (summary, movement) => {
      const quantity = Math.abs(movement.quantity);

      summary.totalMovements += 1;
      summary.totalQuantity += quantity;

      switch (movement.movementType) {
        case 'STOCK_IN':
          summary.stockInTotal += quantity;
          break;
        case 'STOCK_OUT':
          summary.stockOutTotal += quantity;
          break;
        case 'TRANSFER_IN':
          summary.transferInTotal += quantity;
          break;
        case 'TRANSFER_OUT':
          summary.transferOutTotal += quantity;
          break;
        case 'ADJUSTMENT':
          summary.adjustmentTotal += quantity;
          break;
        case 'WRITE_OFF':
          summary.writeOffTotal += quantity;
          break;
        case 'RETURN':
          summary.returnTotal += quantity;
          break;
      }

      return summary;
    },
    {
      totalMovements: 0,
      totalQuantity: 0,
      stockInTotal: 0,
      stockOutTotal: 0,
      transferInTotal: 0,
      transferOutTotal: 0,
      adjustmentTotal: 0,
      writeOffTotal: 0,
      returnTotal: 0,
      latestMovementDate: latestMovement?.movementDate ?? null
    }
  );
}

export function buildStockInOutSummary(
  productId: number,
  movements: StockMovement[],
  totalStockIn: number,
  totalStockOut: number
): StockInOutSummary {
  const latestMovement = sortMovementsByDate(movements, 'desc')[0] ?? null;

  return {
    productId,
    totalStockIn,
    totalStockOut,
    netMovement: totalStockIn - totalStockOut,
    movementCount: movements.length,
    lastMovementDate: latestMovement?.movementDate ?? null
  };
}
