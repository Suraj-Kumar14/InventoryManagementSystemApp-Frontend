import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-inventory-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inventory-dashboard.component.html',
  styleUrls: ['./inventory-dashboard.component.css'],
})
export class InventoryDashboardComponent {
  private dashboardService = inject(DashboardService);
  private router = inject(Router);
  loading = false;
  totalValue = 0;
  lowStockCount = 0;
  topMovingCount = 0;
  deadStockCount = 0;
  recentMovements: Array<{ movementType: string; productId: number; warehouseId: number; quantity: number }> = [];

  goToAddProduct(): void {
    this.router.navigate(['/inventory/products']);
  }

  constructor() {
    this.loading = true;
    this.dashboardService.getInventorySummary().pipe(finalize(() => (this.loading = false))).subscribe({
      next: ({ valuation, lowStock, topMoving, deadStock, movements }) => {
        this.totalValue = valuation.totalValue ?? 0;
        this.lowStockCount = lowStock.length;
        this.topMovingCount = topMoving.length;
        this.deadStockCount = deadStock.length;
        this.recentMovements = movements.slice(0, 5);
      },
    });
  }
}
