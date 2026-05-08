import { Component, Input } from '@angular/core';

/** Stub component — payment summary is no longer computed client-side. */
@Component({
  selector: 'app-payment-summary-cards',
  standalone: true,
  imports: [],
  template: ``,
})
export class PaymentSummaryCardsComponent {
  /** Kept for backward compatibility — ignored. */
  @Input() summary: unknown = null;
}
