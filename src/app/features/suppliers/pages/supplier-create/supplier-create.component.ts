import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { CreateSupplierRequest } from '../../../../core/http/backend.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { SupplierFormComponent } from '../../components/supplier-form/supplier-form.component';
import { SupplierApiService } from '../../services/supplier-api.service';

@Component({
  selector: 'app-supplier-create',
  standalone: true,
  imports: [CommonModule, RouterLink, SupplierFormComponent],
  templateUrl: './supplier-create.component.html',
  styleUrls: ['./supplier-create.component.css'],
})
export class SupplierCreateComponent {
  private readonly supplierApi = inject(SupplierApiService);
  private readonly notifications = inject(NotificationService);
  readonly router = inject(Router);

  loading = false;

  save(request: CreateSupplierRequest): void {
    if (this.loading) {
      return;
    }

    this.loading = true;
    this.supplierApi.createSupplier(request).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (supplier) => {
        this.notifications.success('Supplier saved successfully');
        void this.router.navigate(['/suppliers'], {
          state: {
            createdSupplierId: supplier.supplierId,
            createdSupplierName: supplier.name,
          },
        });
      },
      error: () => {
        this.notifications.error('Failed to save supplier. Please try again.');
      },
    });
  }
}
