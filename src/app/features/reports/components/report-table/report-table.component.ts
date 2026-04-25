import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-report-table',
  standalone: true,
  imports: [CommonModule, DataTableComponent, EmptyStateComponent],
  template: `
    <div class="page-panel">
      @if (title || subtitle) {
        <div class="panel-header">
          <div>
            @if (title) {
              <div class="panel-title">{{ title }}</div>
            }

            @if (subtitle) {
              <div class="panel-subtitle">{{ subtitle }}</div>
            }
          </div>
        </div>
      }

      @if (errorMessage) {
        <div class="state-box error">
          <div>
            <strong>{{ errorTitle }}</strong>
            <p>{{ errorMessage }}</p>
          </div>

          @if (retry.observed) {
            <button class="btn btn-secondary btn-sm" type="button" (click)="retry.emit()">
              Retry
            </button>
          }
        </div>
      } @else if (!loading && data.length === 0) {
        <app-empty-state
          [title]="emptyTitle"
          [description]="emptyDescription"
          icon="RP"
        />
      } @else {
        <app-data-table
          [columns]="columns"
          [data]="data"
          [loading]="loading"
          [totalElements]="totalElements"
          [page]="page"
          [size]="size"
          (pageChange)="pageChange.emit($event)"
          (sortChange)="sortChange.emit($event)"
        />
      }
    </div>
  `,
  styleUrls: ['../../reports.shared.css']
})
export class ReportTableComponent<T = unknown> {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() columns: TableColumn<T>[] = [];
  @Input() data: T[] = [];
  @Input() loading = false;
  @Input() totalElements = 0;
  @Input() page = 0;
  @Input() size = 20;
  @Input() errorTitle = 'Unable to load report';
  @Input() errorMessage = '';
  @Input() emptyTitle = 'No report data';
  @Input() emptyDescription = 'Try changing your filters or loading a different period.';

  @Output() pageChange = new EventEmitter<number>();
  @Output() sortChange = new EventEmitter<{ key: string; dir: 'asc' | 'desc' }>();
  @Output() retry = new EventEmitter<void>();
}
