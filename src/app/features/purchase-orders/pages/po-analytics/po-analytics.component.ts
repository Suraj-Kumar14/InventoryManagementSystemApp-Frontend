import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PurchaseAnalyticsResponse, PurchaseOrderSummaryResponse } from '../../../../core/http/backend.models';
import { PoSummaryCardsComponent } from '../../components/po-summary-cards/po-summary-cards.component';
import { PurchaseOrderApiService } from '../../services/purchase-order-api.service';

@Component({
  selector: 'app-po-analytics',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PoSummaryCardsComponent],
  templateUrl: './po-analytics.component.html',
  styleUrls: ['./po-analytics.component.css'],
})
export class PoAnalyticsComponent implements OnInit {
  private readonly purchaseApi = inject(PurchaseOrderApiService);
  private readonly fb = inject(FormBuilder);

  summary: PurchaseOrderSummaryResponse | null = null;
  analytics: PurchaseAnalyticsResponse | null = null;
  loading = false;

  readonly form = this.fb.group({
    fromDate: this.fb.control<string>(''),
    toDate: this.fb.control<string>(''),
  });

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.loading = true;
    const { fromDate, toDate } = this.form.getRawValue();
    forkJoin({
      summary: this.purchaseApi.getPurchaseOrderSummary(),
      analytics: this.purchaseApi.getPurchaseAnalytics(fromDate || null, toDate || null),
    }).subscribe({
      next: ({ summary, analytics }) => {
        this.summary = summary;
        this.analytics = analytics;
        this.loading = false;
      },
      error: () => {
        this.summary = null;
        this.analytics = null;
        this.loading = false;
      },
    });
  }
}
