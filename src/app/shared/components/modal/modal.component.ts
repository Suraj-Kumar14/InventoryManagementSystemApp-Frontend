import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open) {
      <div class="modal-overlay" (click)="onOverlayClick($event)">
        <div class="modal-container" [style.maxWidth]="maxWidth" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">{{ title }}</h3>
            <button class="btn btn-ghost btn-icon" (click)="close.emit()">✕</button>
          </div>
          <div class="modal-body">
            <ng-content />
          </div>
          @if (showFooter) {
            <div class="modal-footer">
              <ng-content select="[slot=footer]" />
            </div>
          }
        </div>
      </div>
    }
  `
})
export class ModalComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() maxWidth = '560px';
  @Input() showFooter = true;
  @Input() closeOnOverlay = true;
  @Output() close = new EventEmitter<void>();

  onOverlayClick(e: MouseEvent): void {
    if (this.closeOnOverlay) this.close.emit();
  }
}
