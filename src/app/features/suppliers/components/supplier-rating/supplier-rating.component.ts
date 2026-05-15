import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-supplier-rating',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './supplier-rating.component.html',
  styleUrls: ['./supplier-rating.component.css'],
})
export class SupplierRatingComponent {
  @Input() rating: number | null | undefined = 0;

  get normalizedRating(): number {
    const value = Number(this.rating ?? 0);
    return Number.isFinite(value) ? Math.max(0, Math.min(5, value)) : 0;
  }

  get toneClass(): string {
    if (this.normalizedRating >= 4.5) {
      return 'rating rating--excellent';
    }
    if (this.normalizedRating >= 3.5) {
      return 'rating rating--good';
    }
    if (this.normalizedRating >= 2.5) {
      return 'rating rating--watch';
    }
    return 'rating rating--critical';
  }
}
