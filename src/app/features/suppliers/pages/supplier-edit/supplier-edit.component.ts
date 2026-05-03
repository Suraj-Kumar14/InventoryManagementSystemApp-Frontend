import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { SupplierResponse, UpdateSupplierRequest } from '../../../../core/http/backend.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { SupplierFormComponent } from '../../components/supplier-form/supplier-form.component';
import { SupplierApiService } from '../../services/supplier-api.service';

@Component({
  selector: 'app-supplier-edit',
  standalone: true,
  imports: [CommonModule, RouterLink, SupplierFormComponent],
  templateUrl: './supplier-edit.component.html',
  styleUrls: ['./supplier-edit.component.css'],
})
export class SupplierEditComponent implements OnInit {
  private readonly supplierApi = inject(SupplierApiService);
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  supplier: SupplierResponse | null = null;
  loading = false;
  saving = false;

  ngOnInit(): void {
    this.loading = true;
    this.supplierApi.getSupplierById(Number(this.route.snapshot.paramMap.get('id'))).pipe(
      finalize(() => (this.loading = false))
    ).subscribe({
      next: (supplier) => (this.supplier = supplier),
    });
  }

  save(request: UpdateSupplierRequest): void {
    if (!this.supplier) {
      return;
    }
    this.saving = true;
    this.supplierApi.updateSupplier(this.supplier.supplierId, request).pipe(finalize(() => (this.saving = false))).subscribe({
      next: (supplier) => {
        this.notifications.success('Supplier updated successfully');
        this.router.navigate(['/suppliers', supplier.supplierId]);
      },
    });
  }
}
