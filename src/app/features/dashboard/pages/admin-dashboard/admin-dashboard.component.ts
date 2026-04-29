import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent {
  private dashboardService = inject(DashboardService);
  loading = false;
  usersCount = 0;
  warehousesCount = 0;
  stockValue = 0;
  recentAlerts = 0;

  constructor() {
    this.loading = true;
    this.dashboardService.getAdminSummary().pipe(finalize(() => (this.loading = false))).subscribe({
      next: ({ users, warehouses, valuation, alerts }) => {
        this.usersCount = users.length;
        this.warehousesCount = warehouses.length;
        this.stockValue = valuation.totalValue ?? 0;
        this.recentAlerts = alerts.length;
      },
    });
  }
}
