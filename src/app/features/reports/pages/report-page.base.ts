import { computed, inject, signal } from '@angular/core';
import { normalizeRole, Roles } from '../../../core/constants/roles';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  GeneratedReportResponse,
  GenerateReportRequest,
  ReportFilterRequest,
  ReportFormat
} from '../models';
import { ReportApiService } from '../services/report-api.service';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
  getErrorMessage
} from '../report.utils';

type ExportHandlers = {
  onSuccess?: (response: GeneratedReportResponse) => void;
  onError?: (error: unknown) => void;
  successTitle?: string;
};

export abstract class ReportPageBase {
  protected readonly authService = inject(AuthService);
  protected readonly toastService = inject(ToastService);
  protected readonly reportApi = inject(ReportApiService);

  readonly exportBusy = signal(false);
  readonly lastGeneratedReport = signal<GeneratedReportResponse | null>(null);
  readonly currentRole = computed(() => normalizeRole(this.authService.currentUser()?.role));
  readonly currentUserEmail = computed(() => this.authService.currentUser()?.email ?? '');
  readonly canExport = computed(() => this.currentRole() === Roles.ADMIN);
  readonly canTakeSnapshot = computed(() => this.currentRole() === Roles.ADMIN);

  readonly formatCurrency = formatCurrency;
  readonly formatNumber = formatNumber;
  readonly formatPercent = formatPercent;
  readonly formatDate = formatDate;
  readonly formatDateTime = formatDateTime;
  readonly getErrorMessage = getErrorMessage;

  protected exportReport(
    reportType: string,
    format: ReportFormat,
    filters: Partial<ReportFilterRequest> = {},
    handlers?: ExportHandlers
  ): void {
    if (!this.canExport()) {
      return;
    }

    const payload: GenerateReportRequest = {
      reportType,
      format,
      requestedBy: this.currentUserEmail() || 'system'
    };

    if (filters.warehouseId != null) {
      payload.warehouseId = filters.warehouseId;
    }

    if (filters.productId != null) {
      payload.productId = filters.productId;
    }

    if (filters.supplierId != null) {
      payload.supplierId = filters.supplierId;
    }

    if (filters.fromDate) {
      payload.fromDate = filters.fromDate;
    }

    if (filters.toDate) {
      payload.toDate = filters.toDate;
    }

    if (filters.thresholdDays != null) {
      payload.thresholdDays = filters.thresholdDays;
    }

    this.exportBusy.set(true);
    this.lastGeneratedReport.set(null);

    this.reportApi.generateInventoryReport(payload).subscribe({
      next: (response) => {
        this.lastGeneratedReport.set(response);
        this.exportBusy.set(false);
        this.toastService.success(
          handlers?.successTitle ?? 'Report generated',
          response.fileName || response.fileUrl
        );
        handlers?.onSuccess?.(response);
      },
      error: (error) => {
        this.exportBusy.set(false);
        this.toastService.error(
          'Report generation failed',
          getErrorMessage(error, 'Unable to generate the selected report.')
        );
        handlers?.onError?.(error);
      }
    });
  }

  protected showReportError(title: string, error: unknown, fallback: string): void {
    this.toastService.error(title, getErrorMessage(error, fallback));
  }
}
