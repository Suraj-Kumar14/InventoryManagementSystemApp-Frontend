import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { SupplierPerformanceResponse, SupplierResponse, SupplierSummaryResponse } from '../../../../core/http/backend.models';
import { UserRole } from '../../../../shared/config/app-config';
import { SupplierRatingComponent } from '../../components/supplier-rating/supplier-rating.component';
import { SupplierStatusBadgeComponent } from '../../components/supplier-status-badge/supplier-status-badge.component';
import { SupplierApiService } from '../../services/supplier-api.service';

@Component({
  selector: 'app-supplier-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, SupplierStatusBadgeComponent, SupplierRatingComponent],
  templateUrl: './supplier-detail.component.html',
  styleUrls: ['./supplier-detail.component.css'],
})
export class SupplierDetailComponent implements OnInit {
  private readonly supplierApi = inject(SupplierApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  readonly canEdit = this.authService.hasRole([UserRole.ADMIN, UserRole.OFFICER, UserRole.MANAGER]);
  readonly canViewPerformance = this.authService.hasRole([UserRole.ADMIN, UserRole.OFFICER, UserRole.MANAGER]);

  supplier: SupplierResponse | null = null;
  performance: SupplierPerformanceResponse | null = null;
  loading = false;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading = true;
    this.supplierApi.getSupplierById(id).subscribe({
      next: (supplier) => {
        this.supplier = supplier;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });

    if (this.canViewPerformance) {
      this.supplierApi.getSupplierPerformance(id).subscribe({
        next: (performance) => (this.performance = performance),
        error: () => (this.performance = null),
      });
    }
  }
}
