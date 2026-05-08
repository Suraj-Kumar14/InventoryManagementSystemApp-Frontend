import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { PaymentStatus } from '../../models/payment.model';

@Component({
  selector: 'app-payment-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="badge" [ngClass]="statusClass">{{ label }}</span>`,
  styles: [`
    .badge { display:inline-flex; align-items:center; border-radius:999px; padding:0.35rem 0.75rem; font-size:0.75rem; font-weight:700; letter-spacing:0.03em; }
    .pending  { background:#fff7ed; color:#c2410c; }
    .paid     { background:#dcfce7; color:#166534; }
    .partial  { background:#fef3c7; color:#a16207; }
    .cancelled, .failed { background:#fee2e2; color:#b91c1c; }
  `],
})
export class PaymentStatusBadgeComponent {
  @Input({ required: true }) status!: PaymentStatus;

  get label(): string {
    return (this.status ?? '').replace(/_/g, ' ');
  }

  get statusClass(): string {
    switch (this.status as string) {
      case 'PAID':             return 'paid';
      case 'PARTIALLY_PAID':   return 'partial';
      case 'CANCELLED':        return 'cancelled';
      case 'FAILED':           return 'failed';
      case 'PENDING_APPROVAL': return 'pending';
      default:                 return 'pending';
    }
  }
}
