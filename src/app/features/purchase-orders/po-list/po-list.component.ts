import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { PurchaseOrder, PoStatus } from '../../../core/models';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-po-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DataTableComponent],
  templateUrl: './po-list.component.html',
  styleUrls: ['./po-list.component.css']
})
export class PoListComponent implements OnInit {
  poSvc   = inject(PurchaseOrderService);

  orders        = signal<PurchaseOrder[]>([]);
  totalElements = signal(0);
  page          = signal(0);
  loading       = signal(true);
  statusFilter  = signal('');

  readonly statuses: PoStatus[] = ['DRAFT','PENDING_APPROVAL','APPROVED','RECEIVED','CANCELLED','REJECTED'];

  columns: TableColumn<PurchaseOrder>[] = [
    { key: 'poNumber',      label: 'PO Number',     width: '140px', sortable: true },
    { key: 'supplierName',  label: 'Supplier',                      sortable: true },
    { key: 'warehouseName', label: 'Warehouse',      width: '150px' },
    { key: 'totalAmount',   label: 'Total Amount',   width: '130px',
      render: r => `₹${(r['totalAmount'] as number)?.toLocaleString('en-IN')}` },
    { key: 'status',        label: 'Status',         width: '140px',
      render: r => {
        const s = r['status'] as PoStatus;
        const cls: Record<PoStatus, string> = {
          DRAFT: 'badge-gray', PENDING_APPROVAL: 'badge-warning', APPROVED: 'badge-primary',
          RECEIVED: 'badge-success', CANCELLED: 'badge-danger', REJECTED: 'badge-danger'
        };
        return `<span class="badge ${cls[s]}">${s.replace('_', ' ')}</span>`;
      }
    },
    { key: 'createdAt',     label: 'Created',        width: '120px',
      render: r => new Date(r['createdAt'] as string).toLocaleDateString('en-IN') }
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.poSvc.getAll(this.page(), 20, this.statusFilter() || undefined).subscribe({
      next: r => { this.orders.set(r.content); this.totalElements.set(r.totalElements); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onStatusChange(s: string): void { this.statusFilter.set(s); this.page.set(0); this.load(); }
  onPageChange(p: number): void   { this.page.set(p); this.load(); }
  onRowClick(po: PurchaseOrder): void { window.location.href = `/purchase-orders/${po.id}`; }
}
