import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ReportExportActionsComponent } from '../../components/report-export-actions/report-export-actions.component';
import { ReportKpiCardComponent } from '../../components/report-kpi-card/report-kpi-card.component';
import { ReportFormat, TotalStockValueResponse } from '../../models';
import { ReportPageBase } from '../report-page.base';

@Component({
  selector: 'app-total-stock-value-page',
  standalone: true,
  imports: [CommonModule, ReportKpiCardComponent, ReportExportActionsComponent],
  templateUrl: './total-stock-value-page.component.html',
  styleUrls: ['./total-stock-value-page.component.css']
})
export class TotalStockValuePageComponent extends ReportPageBase implements OnInit {
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly snapshotDate = signal(new Date().toISOString().slice(0, 10));
  readonly report = signal<TotalStockValueResponse | null>(null);

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.reportApi.getTotalStockValue(this.snapshotDate() || undefined).subscribe({
      next: (response) => {
        this.report.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(
          this.getErrorMessage(error, 'Unable to load the total stock valuation.')
        );
        this.loading.set(false);
      }
    });
  }

  onDateChange(value: string): void {
    this.snapshotDate.set(value);
  }

  takeSnapshot(): void {
    if (!this.canTakeSnapshot()) {
      return;
    }

    this.reportApi.takeSnapshot({ snapshotDate: this.snapshotDate() || undefined }).subscribe({
      next: () => {
        this.toastService.success('Inventory snapshot created');
        this.loadReport();
      },
      error: (error) => {
        this.toastService.error(
          'Snapshot failed',
          this.getErrorMessage(error, 'Unable to take the requested inventory snapshot.')
        );
      }
    });
  }

  onExport(format: ReportFormat): void {
    this.exportReport('TOTAL_STOCK_VALUE', format, {
      fromDate: this.snapshotDate(),
      toDate: this.snapshotDate()
    });
  }
}
