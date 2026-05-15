import { Component } from '@angular/core';

/** Stub component — payment history/timeline removed in Razorpay-only refactor. */
@Component({
  selector: 'app-payment-timeline',
  standalone: true,
  imports: [],
  template: ``,
})
export class PaymentTimelineComponent {
  /** Kept for backward compatibility — ignored. */
  history: unknown[] = [];
}
