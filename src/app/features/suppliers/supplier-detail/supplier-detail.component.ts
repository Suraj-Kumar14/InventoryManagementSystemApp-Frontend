import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Roles, normalizeRole } from '../../../core/constants/roles';
import { Supplier } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-supplier-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ConfirmDialogComponent],
  templateUrl: './supplier-detail.component.html',
  styleUrls: ['./supplier-detail.component.css']
})
export class SupplierDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly supplierService = inject(SupplierService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly supplier = signal<Supplier | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly updatingRating = signal(false);
  readonly deactivating = signal(false);
  readonly confirmDeactivateOpen = signal(false);

  readonly ratingForm = this.fb.group({
    newRating: [0, [Validators.required, Validators.min(0), Validators.max(5)]]
  });

  ngOnInit(): void {
    this.loadSupplier();
  }

  get currentRole(): string {
    return normalizeRole(this.authService.currentUser()?.role);
  }

  canManage(): boolean {
    return this.currentRole === Roles.ADMIN || this.currentRole === Roles.PURCHASE_OFFICER;
  }

  loadSupplier(): void {
    const supplierId = Number(this.route.snapshot.paramMap.get('id'));
    if (!supplierId) {
      this.router.navigate(['/suppliers']);
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.supplierService.getSupplierById(supplierId).subscribe({
      next: (supplier) => {
        this.supplier.set(supplier);
        this.ratingForm.patchValue({ newRating: supplier.rating });
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message ?? 'Unable to load supplier.');
        this.loading.set(false);
      }
    });
  }

  updateRating(): void {
    const supplier = this.supplier();
    if (!supplier) {
      return;
    }

    if (this.ratingForm.invalid) {
      this.ratingForm.markAllAsTouched();
      return;
    }

    this.updatingRating.set(true);
    this.supplierService
      .updateSupplierRating(supplier.id, Number(this.ratingForm.getRawValue().newRating ?? 0))
      .subscribe({
        next: (updatedSupplier) => {
          this.supplier.set(updatedSupplier);
          this.ratingForm.patchValue({ newRating: updatedSupplier.rating });
          this.updatingRating.set(false);
          this.toast.success('Supplier rating updated');
        },
        error: (error) => {
          this.updatingRating.set(false);
          this.toast.error('Rating update failed', error.error?.message ?? error.message);
        }
      });
  }

  deactivate(): void {
    const supplier = this.supplier();
    if (!supplier) {
      return;
    }

    this.deactivating.set(true);
    this.supplierService.deactivateSupplier(supplier.id).subscribe({
      next: (updatedSupplier) => {
        this.supplier.set(updatedSupplier);
        this.confirmDeactivateOpen.set(false);
        this.deactivating.set(false);
        this.toast.success('Supplier deactivated');
      },
      error: (error) => {
        this.deactivating.set(false);
        this.toast.error('Deactivate failed', error.error?.message ?? error.message);
      }
    });
  }

  formatDate(value?: string): string {
    if (!value) {
      return '-';
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
  }

  formatPaymentTerms(value?: string | null): string {
    if (!value) {
      return '-';
    }

    return value.replace(/_/g, ' ');
  }
}
