import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="flex items-center justify-center"
      [ngClass]="fullPage ? 'fixed inset-0 bg-white/80 backdrop-blur-sm z-50' : 'min-h-[200px]'"
    >
      <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <p *ngIf="message" class="text-neutral-600 font-medium">{{ message }}</p>
      </div>
    </div>
  `,
})
export class LoadingSpinnerComponent {
  @Input() fullPage = false;
  @Input() message: string | null = null;
}


