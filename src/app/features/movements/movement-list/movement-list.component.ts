import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MovementService } from '../../../core/services/movement.service';
import { StockMovement, MovementType } from '../../../core/models';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-movement-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DataTableComponent],
  templateUrl: './movement-list.component.html',
  styleUrls: ['./movement-list.component.css']
})
export class MovementListComponent implements OnInit {
  movementSvc = inject(MovementService);

  movements     = signal<StockMovement[]>([]);
  totalElements = signal(0);
  page          = signal(0);
  loading       = signal(true);

  typeFilter  = '';
  dateFrom    = '';
  dateTo      = '';

  readonly types: MovementType[] = ['STOCK_IN','STOCK_OUT','TRANSFER','ADJUSTMENT','RETURN'];

  columns: TableColumn<StockMovement>[] = [
    { key: 'createdAt',    label: 'Date/Time',     width: '150px',
      render: r => new Date(r['createdAt'] as string).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) },
    { key: 'movementType', label: 'Type',           width: '120px',
      render: r => {
        const type = r['movementType'] as MovementType;
        const cls: Record<MovementType, string> = { STOCK_IN: 'badge-success', STOCK_OUT: 'badge-danger', TRANSFER: 'badge-primary', ADJUSTMENT: 'badge-warning', RETURN: 'badge-purple' };
        return `<span class="badge ${cls[type]}">${type.replace('_', ' ')}</span>`;
      }
    },
    { key: 'productName',   label: 'Product',                      sortable: true },
    { key: 'sku',           label: 'SKU',           width: '110px' },
    { key: 'warehouseName', label: 'Warehouse',     width: '150px' },
    { key: 'quantity',      label: 'Qty',           width: '80px',
      render: r => {
        const type = r['movementType'] as string;
        const qty  = r['quantity'] as number;
        const sign = ['STOCK_IN','RETURN'].includes(type) ? '+' : (type === 'TRANSFER' ? '→' : '−');
        const cls  = ['STOCK_IN','RETURN'].includes(type) ? 'color:var(--color-success)' : (type === 'TRANSFER' ? '' : 'color:var(--color-danger)');
        return `<span style="font-weight:700;${cls}">${sign}${qty}</span>`;
      }
    },
    { key: 'performedBy',   label: 'By',            width: '130px' }
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.movementSvc.getAll(this.page(), 25, {
      type: this.typeFilter || undefined,
      from: this.dateFrom   || undefined,
      to:   this.dateTo     || undefined
    }).subscribe({
      next: r => { this.movements.set(r.content); this.totalElements.set(r.totalElements); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  applyFilters(): void { this.page.set(0); this.load(); }
  clearFilters(): void { this.typeFilter = ''; this.dateFrom = ''; this.dateTo = ''; this.applyFilters(); }
  onPageChange(p: number): void { this.page.set(p); this.load(); }
}
