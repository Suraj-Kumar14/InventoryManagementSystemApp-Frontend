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
  deleteTarget  = signal<Warehouse | null>(null);
  deleting      = signal(false);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.whSvc.getAll(this.page(), 12).subscribe({
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

  confirmDelete(w: Warehouse): void { this.deleteTarget.set(w); }

  doDelete(): void {
    const w = this.deleteTarget();
    if (!w) return;
    this.deleting.set(true);
    this.whSvc.delete(w.id).subscribe({
      next: () => { this.toast.success('Warehouse deleted'); this.deleteTarget.set(null); this.deleting.set(false); this.load(); },
      error: () => { this.toast.error('Delete failed'); this.deleting.set(false); }
    });
  }
}
