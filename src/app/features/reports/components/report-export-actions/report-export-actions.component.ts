import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ReportFormat } from '../../models';

@Component({
  selector: 'app-report-export-actions',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (canExport) {
      <div class="report-export-actions">
        <span class="report-export-actions__label">{{ label }}</span>

        @for (format of formats; track format) {
          <button
            class="btn btn-outline btn-sm"
            type="button"
            [disabled]="busy"
            (click)="exportRequested.emit(format)"
          >
            {{ busy ? 'Working...' : format }}
          </button>
        }
      </div>
    }
  `,
  styles: [
    `
      .report-export-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .report-export-actions__label {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--text-secondary);
      }
    `
  ]
})
export class ReportExportActionsComponent {
  @Input() formats: ReportFormat[] = ['CSV', 'PDF', 'EXCEL'];
  @Input() busy = false;
  @Input() canExport = false;
  @Input() label = 'Export';

  @Output() exportRequested = new EventEmitter<ReportFormat>();
}
