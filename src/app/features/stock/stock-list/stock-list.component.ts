import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  PagedResponse,
  Product,
  StockLevel,
  Warehouse
} from '../../../core/models';
import { ProductService } from '../../../core/services/product.service';
import { StockService } from '../../../core/services/stock.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import {
  DataTableComponent,
  TableColumn
} from '../../../shared/components/data-table/data-table.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-stock-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DataTableComponent, EmptyStateComponent],
  templateUrl: './stock-list.component.html',
  styleUrls: ['./stock-list.component.css']
})
export class StockListComponent implements OnInit {
  private readonly stockService = inject(StockService);
  private readonly warehouseService = inject(WarehouseService);
  private readonly productService = inject(ProductService);

  readonly stocks = signal<StockLevel[]>([]);
  readonly warehouses = signal<Warehouse[]>([]);
  readonly products = signal<Product[]>([]);
  readonly totalElements = signal(0);
  readonly page = signal(0);
  readonly loading = signal(true);
  readonly warehouseFilter = signal<number | undefined>(undefined);

  readonly columns: TableColumn<StockLevel>[] = [
    { key: 'sku', label: 'SKU', width: '120px' },
    { key: 'productName', label: 'Product' },
    { key: 'warehouseName', label: 'Warehouse', width: '170px' },
    { key: 'location', label: 'Location', width: '150px' },
    { key: 'quantity', label: 'On Hand', width: '100px', sortable: true },
    { key: 'reservedQuantity', label: 'Reserved', width: '100px', sortable: true },
    {
      key: 'availableQuantity',
      label: 'Available',
      width: '110px',
      sortable: true,
      render: (row) => {
        const available = Number(row.availableQuantity ?? 0);
        const reorderLevel = Number(row.reorderLevel ?? row.reorderPoint ?? 0);
        const isLow = reorderLevel > 0 ? available <= reorderLevel : available <= 0;
        const badgeClass = isLow ? 'badge-danger' : 'badge-success';
        return `<span class="badge ${badgeClass}">${available}</span>`;
      }
    },
    {
      key: 'lastUpdated',
      label: 'Last Updated',
      width: '170px',
      sortable: true,
      render: (row) => this.formatDate(row.lastUpdated)
    }
  ];

  ngOnInit(): void {
    this.loadMetadata();
  }

  onWarehouseChange(id: string): void {
    this.warehouseFilter.set(id ? Number(id) : undefined);
    this.page.set(0);
    this.loadStock();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.loadStock();
  }

  private loadMetadata(): void {
    this.loading.set(true);

    forkJoin({
      warehousePage: this.warehouseService.getAll(0, 200, 'name', 'asc'),
      products: this.productService.getAllProducts()
    }).subscribe({
      next: ({ warehousePage, products }) => {
        this.warehouses.set(warehousePage.content);
        this.products.set(products);
        this.loadStock();
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private loadStock(): void {
    this.loading.set(true);

    this.stockService.getAll(this.page(), 20, this.warehouseFilter()).subscribe({
      next: (response: PagedResponse<StockLevel>) => {
        this.stocks.set(this.enrichStocks(response.content));
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private enrichStocks(stocks: StockLevel[]): StockLevel[] {
    const warehouseMap = new Map(this.warehouses().map((warehouse) => [warehouse.id, warehouse]));
    const productMap = new Map(this.products().map((product) => [product.id, product]));

    return stocks.map((stock) => {
      const warehouse = warehouseMap.get(stock.warehouseId);
      const product = productMap.get(stock.productId);
      const quantity = Number(stock.quantity ?? 0);

      return {
        ...stock,
        sku: stock.sku ?? product?.sku ?? '-',
        productName: stock.productName ?? product?.name ?? `Product #${stock.productId}`,
        warehouseName: stock.warehouseName ?? warehouse?.name ?? `Warehouse #${stock.warehouseId}`,
        location: stock.location ?? warehouse?.location ?? '-',
        reorderLevel: stock.reorderLevel ?? stock.reorderPoint ?? product?.reorderLevel ?? 0,
        reorderPoint: stock.reorderPoint ?? stock.reorderLevel ?? product?.reorderLevel ?? 0,
        stockValue: stock.stockValue ?? quantity * Number(product?.costPrice ?? 0)
      };
    });
  }

  private formatDate(value?: string): string {
    if (!value) {
      return '-';
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
  }
}
