import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      (click)="onClick()"
      [disabled]="isLoading || disabled"
      [ngClass]="getButtonClasses()"
      class="inline-flex items-center justify-center gap-2 px-4 py-2 font-medium rounded-lg transition-all duration-200"
    >
      <span *ngIf="isLoading" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
      <span>{{ label }}</span>
    </button>
  `,
})
export class ButtonComponent {
  @Input() label = 'Button';
  @Input() isLoading = false;
  @Input() disabled = false;
  @Input() variant: 'primary' | 'secondary' | 'danger' | 'success' = 'primary';
  @Output() clicked = new EventEmitter<void>();

  onClick(): void {
    if (!this.isLoading && !this.disabled) {
      this.clicked.emit();
    }
  }

  getButtonClasses(): string {
    const baseClasses = 'font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
      secondary: 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300 active:bg-neutral-400',
      danger: 'bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-800',
      success: 'bg-success-600 text-white hover:bg-success-700 active:bg-success-800',
    };

    return `${baseClasses} ${variantClasses[this.variant]}`;
  }
}



