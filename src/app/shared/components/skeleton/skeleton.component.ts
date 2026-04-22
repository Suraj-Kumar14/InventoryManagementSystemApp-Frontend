import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-wrapper">
      @for (row of rows; track row) {
        <div class="skeleton-row">
          @for (col of columns; track col) {
            <div class="skeleton" [style.width]="col.width || '100%'" [style.height]="col.height || '1rem'"></div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .skeleton-wrapper { display: flex; flex-direction: column; gap: 1rem; }
    .skeleton-row { display: flex; gap: 1rem; align-items: center; }
  `]
})
export class SkeletonComponent {
  @Input() rowCount = 5;
  @Input() columns: { width?: string; height?: string }[] = [
    { width: '40px', height: '40px' },
    { width: '30%' },
    { width: '20%' },
    { width: '15%' },
    { width: '10%' }
  ];

  get rows(): number[] { return Array.from({ length: this.rowCount }, (_, i) => i); }
}
