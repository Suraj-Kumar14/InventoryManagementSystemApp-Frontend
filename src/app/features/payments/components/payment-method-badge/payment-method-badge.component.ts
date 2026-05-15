import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { PaymentMethod } from '../../models/payment.model';

@Component({
  selector: 'app-payment-method-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="method-badge">{{ method.replaceAll('_', ' ') }}</span>`,
  styles: [`
    .method-badge {
      display:inline-flex;
      padding:0.3rem 0.7rem;
      border-radius:999px;
      background:linear-gradient(135deg, #f8fafc, #dbeafe);
      color:#1e3a8a;
      font-size:0.75rem;
      font-weight:700;
    }
  `],
})
export class PaymentMethodBadgeComponent {
  @Input({ required: true }) method!: PaymentMethod;
}
