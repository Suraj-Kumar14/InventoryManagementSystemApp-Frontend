import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Roles, normalizeRole } from '../../../core/constants/roles';
import { Supplier, SupplierFilter } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

type StatusFilter = '' | 'active' | 'inactive';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ConfirmDialogComponent, EmptyStateComponent],
  templateUrl: './supplier-list.component.html',
  styleUrls: ['./supplier-list.component.css']
})
export class SupplierListComponent implements OnInit {
  private readonly supplierService = inject(SupplierService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly suppliers = signal<Supplier[]>([]);
  readonly cityOptions = signal<string[]>([]);
  readonly countryOptions = signal<string[]>([]);
  readonly totalElements = signal(0);
  readonly page = signal(0);
  readonly size = signal(10);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly deactivateTarget = signal<Supplier | null>(null);
  readonly deactivating = signal(false);

  search = '';
  city = '';
  country = '';
  status: StatusFilter = '';
  sortBy: NonNullable<SupplierFilter['sortBy']> = 'name';
  sortDir: 'asc' | 'desc' = 'asc';

  ngOnInit(): void {
    this.loadFilterOptions();
    this.load();
  }

  get currentRole(): string {
    return normalizeRole(this.authService.currentUser()?.role);
  }

  get totalPages(): number {
    return Math.max(Math.ceil(this.totalElements() / this.size()), 1);
  }

  get pageNumbers(): number[] {
    const currentPage = this.page();
    const totalPages = this.totalPages;
    const start = Math.max(currentPage - 2, 0);
    const end = Math.min(currentPage + 2, totalPages - 1);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }

  get rangeStart(): number {
    return this.totalElements() === 0 ? 0 : this.page() * this.size() + 1;
  }

  get rangeEnd(): number {
    return Math.min((this.page() + 1) * this.size(), this.totalElements());
  }

  canManage(): boolean {
    return this.currentRole === Roles.ADMIN || this.currentRole === Roles.PURCHASE_OFFICER;
  }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.supplierService
      .getAllSuppliers({
        page: this.page(),
        size: this.size(),
        search: this.search,
        city: this.city,
        country: this.country,
        isActive: this.toActiveFilter(),
        sortBy: this.sortBy,
        sortDir: this.sortDir
      })
      .subscribe({
        next: (response) => {
          this.suppliers.set(response.content);
          this.totalElements.set(response.totalElements);
          this.loading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(error.error?.message ?? 'Unable to load suppliers right now.');
          this.loading.set(false);
        }
      });
  }

  onFiltersChange(): void {
    this.page.set(0);
    this.load();
  }

  clearFilters(): void {
    this.search = '';
    this.city = '';
    this.country = '';
    this.status = '';
    this.sortBy = 'name';
    this.sortDir = 'asc';
    this.page.set(0);
    this.load();
  }

  onPageChange(nextPage: number): void {
    if (nextPage < 0 || nextPage >= this.totalPages) {
      return;
    }

    this.page.set(nextPage);
    this.load();
  }

  toggleSort(sortBy: NonNullable<SupplierFilter['sortBy']>): void {
    if (this.sortBy === sortBy) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortDir = 'asc';
    }

    this.load();
  }

  confirmDeactivate(supplier: Supplier): void {
    this.deactivateTarget.set(supplier);
  }

  doDeactivate(): void {
    const supplier = this.deactivateTarget();
    if (!supplier) {
      return;
    }

    this.deactivating.set(true);
    this.supplierService.deactivateSupplier(supplier.id).subscribe({
      next: () => {
        this.toast.success('Supplier deactivated');
        this.deactivateTarget.set(null);
        this.deactivating.set(false);
        this.load();
      },
      error: (error) => {
        this.toast.error('Deactivate failed', error.error?.message ?? error.message);
        this.deactivating.set(false);
      }
    });
  }

  getSortIndicator(column: NonNullable<SupplierFilter['sortBy']>): string {
    if (this.sortBy !== column) {
      return '';
    }

    return this.sortDir === 'asc' ? '^' : 'v';
  }

  formatRating(rating: number): string {
    return `${rating.toFixed(1)} / 5`;
  }

  private loadFilterOptions(): void {
    this.supplierService.getAllList().subscribe({
      next: (suppliers) => {
        this.cityOptions.set(this.uniqueValues(suppliers.map((supplier) => supplier.city)));
        this.countryOptions.set(this.uniqueValues(suppliers.map((supplier) => supplier.country)));
      }
    });
  }

  private uniqueValues(values: string[]): string[] {
    return [...new Set(values.filter((value) => value.trim()))].sort((left, right) =>
      left.localeCompare(right, undefined, { sensitivity: 'base' })
    );
  }

  private toActiveFilter(): boolean | null {
    switch (this.status) {
      case 'active':
        return true;
      case 'inactive':
        return false;
      default:
        return null;
    }
  }
}
