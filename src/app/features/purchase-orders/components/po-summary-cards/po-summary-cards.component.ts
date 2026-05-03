import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { PurchaseOrderSummaryResponse } from '../../../../core/http/backend.models';

@Component({
  selector: 'app-po-summary-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './po-summary-cards.component.html',
  styleUrls: ['./po-summary-cards.component.css'],
})
export class PoSummaryCardsComponent {
  @Input() summary: PurchaseOrderSummaryResponse | null = null;
}
