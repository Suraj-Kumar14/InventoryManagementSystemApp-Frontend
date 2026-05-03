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
    .draft { background:#eef2ff; color:#3730a3; }
    .pending { background:#fff7ed; color:#c2410c; }
    .approved { background:#ecfdf5; color:#047857; }
    .paid { background:#dcfce7; color:#166534; }
    .partial { background:#fef3c7; color:#a16207; }
    .cancelled, .rejected, .reversed { background:#fee2e2; color:#b91c1c; }
  `],
})
export class PaymentStatusBadgeComponent {
  @Input({ required: true }) status!: PaymentStatus;

  get label(): string {
    return this.status.replace(/_/g, ' ');
  }

  get statusClass(): string {
    switch (this.status) {
      case 'DRAFT':
        return 'draft';
      case 'PENDING_APPROVAL':
        return 'pending';
      case 'APPROVED':
        return 'approved';
      case 'PARTIALLY_PAID':
        return 'partial';
      case 'PAID':
        return 'paid';
      default:
        return this.status.toLowerCase();
    }
  }
}
