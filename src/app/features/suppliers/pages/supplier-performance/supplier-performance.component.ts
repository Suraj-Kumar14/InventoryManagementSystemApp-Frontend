import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { SupplierPerformanceResponse, SupplierResponse } from '../../../../core/http/backend.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserRole } from '../../../../shared/config/app-config';
import { SupplierApiService } from '../../services/supplier-api.service';

@Component({
  selector: 'app-supplier-performance',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './supplier-performance.component.html',
  styleUrls: ['./supplier-performance.component.css'],
})
export class SupplierPerformanceComponent implements OnInit {
  private readonly supplierApi = inject(SupplierApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly notifications = inject(NotificationService);
  private readonly authService = inject(AuthService);

  readonly canRate = this.authService.hasRole([UserRole.ADMIN, UserRole.PURCHASE_OFFICER, UserRole.INVENTORY_MANAGER]);

  supplier: SupplierResponse | null = null;
  performance: SupplierPerformanceResponse | null = null;
  loading = false;
  actionLoading = false;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading = true;
    this.supplierApi.getSupplierById(id).subscribe({ next: (supplier) => (this.supplier = supplier) });
    this.supplierApi.getSupplierPerformance(id).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (performance) => (this.performance = performance),
      error: () => (this.performance = null),
    });
  }

  updateRating(): void {
    if (!this.supplier) {
      return;
    }
    const rating = Number(window.prompt('Overall rating between 0 and 5:', String(this.supplier.rating ?? 0)));
    if (Number.isNaN(rating)) {
      return;
    }
    const remarks = window.prompt('Optional rating remarks:') ?? '';
    this.actionLoading = true;
    this.supplierApi.updateSupplierRating(this.supplier.supplierId, { rating, remarks }).pipe(
      finalize(() => (this.actionLoading = false))
    ).subscribe({
      next: (supplier) => {
        this.supplier = supplier;
        this.notifications.success('Supplier rating updated successfully');
      },
    });
  }
}
