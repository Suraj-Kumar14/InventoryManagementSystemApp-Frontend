import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-warehouse-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './warehouse-dashboard.component.html',
  styleUrls: ['./warehouse-dashboard.component.css'],
})
export class WarehouseDashboardComponent {
  private dashboardService = inject(DashboardService);
  loading = false;
  warehouses = 0;
  movements = 0;
  alerts = 0;
  lowStock = 0;

  constructor() {
    this.loading = true;
    this.dashboardService.getWarehouseSummary().pipe(finalize(() => (this.loading = false))).subscribe({
      next: ({ warehouses, movements, alerts, lowStock }) => {
        this.warehouses = warehouses.length;
        this.movements = movements.length;
        this.alerts = alerts.length;
        this.lowStock = lowStock.length;
      },
    });
  }
}
