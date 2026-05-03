import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SupplierSummaryResponse } from '../../../../core/http/backend.models';

@Component({
  selector: 'app-supplier-summary-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './supplier-summary-cards.component.html',
  styleUrls: ['./supplier-summary-cards.component.css'],
})
export class SupplierSummaryCardsComponent {
  @Input({ required: true }) summary!: SupplierSummaryResponse;
}
