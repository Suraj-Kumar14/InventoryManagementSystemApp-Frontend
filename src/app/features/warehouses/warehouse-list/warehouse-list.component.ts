import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { Warehouse, PagedResponse } from '../../../core/models';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-warehouse-list',
  standalone: true,
  imports: [CommonModule, RouterLink, EmptyStateComponent, SkeletonComponent, ConfirmDialogComponent],
  templateUrl: './warehouse-list.component.html',
  styleUrls: ['./warehouse-list.component.css']
})
export class WarehouseListComponent implements OnInit {
  whSvc  = inject(WarehouseService);
  toast  = inject(ToastService);

  warehouses    = signal<Warehouse[]>([]);
  totalElements = signal(0);
  page          = signal(0);
  loading       = signal(true);
  deactivateTarget = signal<Warehouse | null>(null);
  deactivating     = signal(false);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.whSvc.getAll(this.page(), 12, 'name', 'asc').subscribe({
      next: (res: PagedResponse<Warehouse>) => {
        this.warehouses.set(res.content);
        this.totalElements.set(res.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getUtilizationColor(pct: number): string {
    if (pct >= 90) return 'danger';
    if (pct >= 70) return 'warning';
    return 'success';
  }

  confirmDeactivate(warehouse: Warehouse): void {
    this.deactivateTarget.set(warehouse);
  }

  doDeactivate(): void {
    const warehouse = this.deactivateTarget();
    if (!warehouse) return;

    this.deactivating.set(true);
    this.whSvc.deactivate(warehouse.id).subscribe({
      next: () => {
        this.toast.success('Warehouse deactivated');
        this.deactivateTarget.set(null);
        this.deactivating.set(false);
        this.load();
      },
      error: (error) => {
        this.toast.error('Deactivate failed', error.error?.message);
        this.deactivating.set(false);
      }
    });
  }
}
