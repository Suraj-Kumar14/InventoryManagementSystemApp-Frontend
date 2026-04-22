import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  template: `
    <app-modal [open]="open" [title]="title" maxWidth="440px" (close)="cancel.emit()">
      <p style="color:var(--text-secondary);font-size:.9375rem;line-height:1.6">{{ message }}</p>
      <div slot="footer">
        <button class="btn btn-secondary" (click)="cancel.emit()">{{ cancelLabel }}</button>
        <button class="btn" [class]="confirmClass" [disabled]="loading" (click)="confirm.emit()">
          @if (loading) { <span class="spinner"></span> }
          {{ confirmLabel }}
        </button>
      </div>
    </app-modal>
  `
})
export class ConfirmDialogComponent {
  @Input() open = false;
  @Input() title = 'Are you sure?';
  @Input() message = 'This action cannot be undone.';
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel = 'Cancel';
  @Input() confirmClass = 'btn-danger';
  @Input() loading = false;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel  = new EventEmitter<void>();
}
