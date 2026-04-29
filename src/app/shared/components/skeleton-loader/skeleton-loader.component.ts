import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <div *ngFor="let row of Array(rows)" class="flex gap-4">
        <div
          *ngFor="let col of Array(cols)"
          class="h-8 bg-neutral-200 rounded animate-pulse flex-1"
        ></div>
      </div>
    </div>
  `,
})
export class SkeletonLoaderComponent {
  @Input() rows = 5;
  @Input() cols = 3;

  Array = Array;
}

