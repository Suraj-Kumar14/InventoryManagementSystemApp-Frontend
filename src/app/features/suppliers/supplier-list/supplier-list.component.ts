import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupplierService } from '../../../core/services/supplier.service';
import { Supplier, PagedResponse } from '../../../core/models';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DataTableComponent, ConfirmDialogComponent],
  templateUrl: './supplier-list.component.html',
  styleUrls: ['./supplier-list.component.css']
})
export class SupplierListComponent implements OnInit {
  suppSvc = inject(SupplierService);
  toast   = inject(ToastService);

  suppliers     = signal<Supplier[]>([]);
  totalElements = signal(0);
  page          = signal(0);
  loading       = signal(true);
  search        = '';
  deleteTarget  = signal<Supplier | null>(null);
  deleting      = signal(false);

  columns: TableColumn<Supplier>[] = [
    { key: 'name',         label: 'Supplier Name',                   sortable: true },
    { key: 'email',        label: 'Email',          width: '200px'  },
    { key: 'phone',        label: 'Phone',          width: '130px'  },
    { key: 'city',         label: 'City',           width: '120px'  },
    { key: 'rating',       label: 'Rating',         width: '100px',
      render: r => {
        const stars = '★'.repeat(Math.round(r['rating'] as number));
        return `<span style="color:#F59E0B;letter-spacing:2px">${stars}</span> <small>${r['rating']}</small>`;
      }
    },
    { key: 'active',       label: 'Status',         width: '90px',
      render: r => r['active'] ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-gray">Inactive</span>' }
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.suppSvc.getAll(this.page(), 20, this.search).subscribe({
      next: (r: PagedResponse<Supplier>) => {
        this.suppliers.set(r.content);
        this.totalElements.set(r.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch(v: string): void   { this.search = v; this.page.set(0); this.load(); }
  onPageChange(p: number): void { this.page.set(p); this.load(); }
  confirmDelete(s: Supplier): void { this.deleteTarget.set(s); }

  doDelete(): void {
    // Suppliers usually shouldn't be hard-deleted; soft-deactivation preferred
    this.toast.warning('Cannot delete', 'Suppliers can only be deactivated via Edit.');
    this.deleteTarget.set(null);
  }
}
