import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { PaymentHistoryResponse } from '../../models/payment.model';

@Component({
  selector: 'app-payment-timeline',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <section class="timeline" *ngIf="history?.length; else empty">
      <div class="timeline-item" *ngFor="let item of history">
        <div class="dot"></div>
        <div class="body">
          <div class="head">
            <strong>{{ item.action.replaceAll('_', ' ') }}</strong>
            <span>{{ item.actionAt | date:'medium' }}</span>
          </div>
          <p *ngIf="item.oldStatus || item.newStatus">{{ item.oldStatus || 'NEW' }} to {{ item.newStatus || 'NEW' }}</p>
          <small *ngIf="item.remarks">{{ item.remarks }}</small>
        </div>
      </div>
    </section>
    <ng-template #empty>
      <p class="empty">No payment timeline entries yet.</p>
    </ng-template>
  `,
  styles: [`
    .timeline { display:grid; gap:1rem; }
    .timeline-item { display:grid; grid-template-columns:16px 1fr; gap:0.9rem; align-items:start; }
    .dot { width:14px; height:14px; border-radius:50%; background:#0f766e; margin-top:0.35rem; box-shadow:0 0 0 4px rgba(15,118,110,0.12); }
    .body { padding:0.95rem 1rem; border-radius:1rem; border:1px solid #e2e8f0; background:#fff; }
    .head { display:flex; justify-content:space-between; gap:1rem; flex-wrap:wrap; }
    .head span, .body small, .empty { color:#64748b; }
    .body p { margin:0.35rem 0; color:#0f172a; }
  `],
})
export class PaymentTimelineComponent {
  @Input() history: PaymentHistoryResponse[] | null = [];
}
