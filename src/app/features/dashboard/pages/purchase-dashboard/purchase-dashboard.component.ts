import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-purchase-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './purchase-dashboard.component.html',
  styleUrls: ['./purchase-dashboard.component.css'],
})
export class PurchaseDashboardComponent {
  private dashboardService = inject(DashboardService);
  loading = false;
  totalOrders = 0;
  overdueOrders = 0;
  totalSpend = 0;
  topSuppliers = 0;

  constructor() {
    this.loading = true;
    this.dashboardService.getPurchaseSummary().pipe(finalize(() => (this.loading = false))).subscribe({
      next: ({ orders, overdue, summary, suppliers }) => {
        this.totalOrders = orders.length;
        this.overdueOrders = overdue.length;
        this.totalSpend = summary.totalSpend ?? 0;
        this.topSuppliers = suppliers.length;
      },
    });
  }
}
