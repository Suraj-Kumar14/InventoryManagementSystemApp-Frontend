import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MovementSummaryResponse } from '../../../../core/http/backend.models';

@Component({
  selector: 'app-movement-summary-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="cards" *ngIf="summary">
      <article class="card"><span>Total Movements</span><strong>{{ summary.totalMovements }}</strong></article>
      <article class="card"><span>Stock In</span><strong>{{ summary.totalStockInQuantity | number:'1.0-2' }}</strong></article>
      <article class="card"><span>Stock Out</span><strong>{{ summary.totalStockOutQuantity | number:'1.0-2' }}</strong></article>
      <article class="card"><span>Transfers</span><strong>{{ summary.totalTransferQuantity | number:'1.0-2' }}</strong></article>
      <article class="card"><span>Movement Value</span><strong>{{ summary.totalMovementValue | currency:'INR':'symbol':'1.0-0' }}</strong></article>
      <article class="card"><span>Today</span><strong>{{ summary.movementsToday }}</strong></article>
    </section>
  `,
  styles: [`
    .cards { display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:1rem; }
    .card { background:linear-gradient(180deg, #fff, #f5f7fb); border:1px solid #e7ebf3; border-radius:20px; padding:1rem 1.1rem; box-shadow:0 16px 34px rgba(15,23,42,0.06); }
    .card span { display:block; color:#56637a; font-size:0.85rem; margin-bottom:0.5rem; }
    .card strong { font-size:1.4rem; color:#0f172a; }
  `],
})
export class MovementSummaryCardsComponent {
  @Input() summary: MovementSummaryResponse | null = null;
}
