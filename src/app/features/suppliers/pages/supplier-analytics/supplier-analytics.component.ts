import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SupplierResponse, SupplierSummaryResponse } from '../../../../core/http/backend.models';
import { SupplierRatingComponent } from '../../components/supplier-rating/supplier-rating.component';
import { SupplierStatusBadgeComponent } from '../../components/supplier-status-badge/supplier-status-badge.component';
import { SupplierSummaryCardsComponent } from '../../components/supplier-summary-cards/supplier-summary-cards.component';
import { SupplierApiService } from '../../services/supplier-api.service';

@Component({
  selector: 'app-supplier-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink, SupplierSummaryCardsComponent, SupplierStatusBadgeComponent, SupplierRatingComponent],
  templateUrl: './supplier-analytics.component.html',
  styleUrls: ['./supplier-analytics.component.css'],
})
export class SupplierAnalyticsComponent implements OnInit {
  private readonly supplierApi = inject(SupplierApiService);

  summary: SupplierSummaryResponse | null = null;
  topRatedSuppliers: SupplierResponse[] = [];
  loading = false;

  ngOnInit(): void {
    this.loading = true;
    this.supplierApi.getSupplierSummary().subscribe({ next: (summary) => (this.summary = summary) });
    this.supplierApi.getTopRatedSuppliers().subscribe({
      next: (suppliers) => {
        this.topRatedSuppliers = suppliers;
        this.loading = false;
      },
      error: () => {
        this.topRatedSuppliers = [];
        this.loading = false;
      },
    });
  }
}
