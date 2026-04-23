import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ProductSummary } from '../../models';

@Component({
  selector: 'app-product-summary-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-summary-card.component.html',
  styleUrls: ['./product-summary-card.component.css']
})
export class ProductSummaryCardComponent {
  @Input({ required: true }) product!: ProductSummary;
  @Input() tone: 'default' | 'warning' = 'default';

  get initials(): string {
    return this.product.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }
}
