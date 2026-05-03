import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ReportExportFormat } from '../../../core/http/backend.models';

@Component({
  selector: 'app-report-export-buttons',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="export-group">
      <button
        *ngFor="let format of formats"
        type="button"
        class="export-btn"
        [disabled]="loading === format"
        (click)="exportRequested.emit(format)"
      >
        {{ loading === format ? 'Exporting...' : 'Export ' + format }}
      </button>
    </div>
  `,
  styles: [
    `
      .export-group {
        display: flex;
        flex-wrap: wrap;
        gap: 0.65rem;
      }
      .export-btn {
        border: none;
        border-radius: 999px;
        padding: 0.72rem 1rem;
        background: #0f172a;
        color: #fff;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s ease, opacity 0.2s ease;
      }
      .export-btn:hover:not(:disabled) {
        transform: translateY(-1px);
      }
      .export-btn:disabled {
        opacity: 0.65;
        cursor: wait;
      }
    `,
  ],
})
export class ReportExportButtonsComponent {
  @Input() formats: ReportExportFormat[] = ['CSV', 'EXCEL', 'PDF'];
  @Input() loading: ReportExportFormat | null = null;
  @Output() exportRequested = new EventEmitter<ReportExportFormat>();
}
