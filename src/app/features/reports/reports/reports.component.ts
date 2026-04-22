import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../../core/services/report.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { LowStockReport, TopMovingProduct, DeadStockItem, WarehouseStockValue, Warehouse } from '../../../core/models';
import { ToastService } from '../../../core/services/toast.service';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

type ReportTab = 'low-stock' | 'top-movers' | 'dead-stock' | 'warehouse-value';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, EmptyStateComponent],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  reportSvc = inject(ReportService);
  whSvc     = inject(WarehouseService);
  toast     = inject(ToastService);

  activeTab     = signal<ReportTab>('low-stock');
  loading       = signal(false);
  warehouses    = signal<Warehouse[]>([]);
  warehouseId   = '';
  exporting     = signal(false);

  lowStock     = signal<LowStockReport[]>([]);
  topMovers    = signal<TopMovingProduct[]>([]);
  deadStock    = signal<DeadStockItem[]>([]);
  whValues     = signal<WarehouseStockValue[]>([]);

  lowStockCols: TableColumn<LowStockReport>[] = [
    { key: 'sku',             label: 'SKU',           width: '110px' },
    { key: 'productName',     label: 'Product',                       sortable: true },
    { key: 'warehouseName',   label: 'Warehouse',     width: '160px' },
    { key: 'currentQuantity', label: 'Current Qty',   width: '110px',
      render: r => `<span class="font-semibold text-danger">${r['currentQuantity']}</span>` },
    { key: 'reorderPoint',    label: 'Reorder Point', width: '115px' },
    { key: 'stockoutRisk',    label: 'Risk',          width: '90px',
      render: r => r['stockoutRisk'] ? `<span class="badge badge-danger">High</span>` : `<span class="badge badge-warning">Medium</span>` }
  ];

  topMoverCols: TableColumn<TopMovingProduct>[] = [
    { key: 'rank',          label: '#',          width: '50px' },
    { key: 'sku',           label: 'SKU',        width: '110px' },
    { key: 'productName',   label: 'Product',                    sortable: true },
    { key: 'totalQuantity', label: 'Total Moved', width: '120px',
      render: r => `<span class="font-semibold">${(r['totalQuantity'] as number).toLocaleString()}</span>` },
    { key: 'totalValue',    label: 'Value',      width: '120px',
      render: r => `₹${(r['totalValue'] as number).toLocaleString('en-IN')}` }
  ];

  deadStockCols: TableColumn<DeadStockItem>[] = [
    { key: 'sku',           label: 'SKU',           width: '110px' },
    { key: 'productName',   label: 'Product',                       sortable: true },
    { key: 'warehouseName', label: 'Warehouse',     width: '160px' },
    { key: 'quantity',      label: 'Qty On Hand',   width: '110px' },
    { key: 'stockValue',    label: 'Stock Value',   width: '120px',
      render: r => `₹${(r['stockValue'] as number).toLocaleString('en-IN')}` },
    { key: 'daysSinceLastMovement', label: 'Days Idle', width: '100px',
      render: r => `<span class="badge badge-danger">${r['daysSinceLastMovement']}d</span>` }
  ];

  ngOnInit(): void {
    this.whSvc.getActive().subscribe({ next: w => this.warehouses.set(w) });
    this.loadTab('low-stock');
  }

  setTab(tab: ReportTab): void { this.activeTab.set(tab); this.loadTab(tab); }

  loadTab(tab: ReportTab): void {
    this.loading.set(true);
    const wId = this.warehouseId ? +this.warehouseId : undefined;

    const loaders: Record<ReportTab, () => void> = {
      'low-stock':       () => this.reportSvc.getLowStockReport(wId).subscribe({ next: d => { this.lowStock.set(d);  this.loading.set(false); }, error: () => this.loading.set(false) }),
      'top-movers':      () => this.reportSvc.getTopMovingProducts(20, wId).subscribe({ next: d => { this.topMovers.set(d); this.loading.set(false); }, error: () => this.loading.set(false) }),
      'dead-stock':      () => this.reportSvc.getDeadStock(90, wId).subscribe({ next: d => { this.deadStock.set(d);  this.loading.set(false); }, error: () => this.loading.set(false) }),
      'warehouse-value': () => this.reportSvc.getStockValueByWarehouse().subscribe({ next: d => { this.whValues.set(d); this.loading.set(false); }, error: () => this.loading.set(false) })
    };
    loaders[tab]();
  }

  exportCSV(): void {
    this.exporting.set(true);
    this.reportSvc.exportReport(this.activeTab(), 'CSV', { warehouseId: this.warehouseId || undefined }).subscribe({
      next: res => { this.toast.success('Export ready', res.fileUrl); this.exporting.set(false); },
      error: () => { this.toast.error('Export failed'); this.exporting.set(false); }
    });
  }
}
