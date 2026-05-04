import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { MovementResponse, MovementSummaryResponse, PageResponse, ReverseMovementRequest } from '../../../../core/http/backend.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserRole } from '../../../../shared/config/app-config';
import {
  MOVEMENT_DIRECTION_OPTIONS,
  MOVEMENT_TYPE_OPTIONS,
  MovementListQuery,
  REFERENCE_TYPE_OPTIONS,
} from '../../models/movement.model';
import { MovementApiService } from '../../services/movement-api.service';
import { MovementDirectionBadgeComponent } from '../../components/movement-direction-badge/movement-direction-badge.component';
import { MovementReversalModalComponent } from '../../components/movement-reversal-modal/movement-reversal-modal.component';
import { MovementSummaryCardsComponent } from '../../components/movement-summary-cards/movement-summary-cards.component';
import { MovementTypeBadgeComponent } from '../../components/movement-type-badge/movement-type-badge.component';

@Component({
  selector: 'app-movement-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MovementTypeBadgeComponent,
    MovementDirectionBadgeComponent,
    MovementSummaryCardsComponent,
    MovementReversalModalComponent,
  ],
  template: `
    <section class="page">
      <header class="hero">
        <div>
          <p class="eyebrow">Inventory Traceability</p>
          <h1>Stock movement history</h1>
          <p>Immutable movement records across GRN, issues, transfers, adjustments, returns, and reversals.</p>
        </div>
        <div class="hero-actions" *ngIf="canExport">
          <button type="button" (click)="exportCsv()" [disabled]="exporting">{{ exporting ? 'Exporting...' : 'Export CSV' }}</button>
          <a routerLink="/movements/export" class="ghost">Advanced export</a>
        </div>
      </header>

      <app-movement-summary-cards [summary]="summary"></app-movement-summary-cards>

      <form class="filters" [formGroup]="filtersForm" (ngSubmit)="applyFilters()">
        <input formControlName="keyword" placeholder="Search movement number, product, warehouse, notes" />
        <input formControlName="productId" type="number" min="1" placeholder="Product ID" />
        <input formControlName="warehouseId" type="number" min="1" placeholder="Warehouse ID" />
        <select formControlName="movementType">
          <option value="">All movement types</option>
          <option *ngFor="let option of movementTypes" [value]="option">{{ option }}</option>
        </select>
        <select formControlName="direction">
          <option value="">All directions</option>
          <option *ngFor="let option of movementDirections" [value]="option">{{ option }}</option>
        </select>
        <select formControlName="referenceType">
          <option value="">All reference types</option>
          <option *ngFor="let option of referenceTypes" [value]="option">{{ option }}</option>
        </select>
        <input formControlName="referenceId" placeholder="Reference ID" />
        <input formControlName="performedBy" type="number" min="1" placeholder="Performed By" />
        <input formControlName="fromDate" type="date" />
        <input formControlName="toDate" type="date" />
        <div class="filter-actions">
          <button type="submit" [disabled]="loading">{{ loading ? 'Searching...' : 'Apply Filters' }}</button>
          <button type="button" class="ghost" (click)="resetFilters()">Reset</button>
        </div>
      </form>

      <section class="table-shell">
        <div class="table-header">
          <h2>Movement ledger</h2>
          <span>{{ pageData?.totalElements ?? 0 }} records</span>
        </div>

        <div class="loading" *ngIf="loading">Loading movement history...</div>
        <div class="empty" *ngIf="!loading && !movements.length">No stock movements found for the selected filters.</div>

        <div class="table" *ngIf="!loading && movements.length">
          <div class="row head">
            <span>Movement</span>
            <span>Date</span>
            <span>Product</span>
            <span>Warehouse</span>
            <span>Type</span>
            <span>Direction</span>
            <span>Quantity</span>
            <span>Value</span>
            <span>Reference</span>
            <span>Actions</span>
          </div>
          <div class="row" *ngFor="let movement of movements" [class.reversal]="movement.isReversal">
            <span>
              <strong>{{ movement.movementNumber }}</strong>
              <small *ngIf="movement.isReversal">Reversal</small>
            </span>
            <span>{{ movement.movementDate | date:'medium' }}</span>
            <span>{{ movement.productName || ('Product #' + movement.productId) }}</span>
            <span>{{ movement.warehouseName || ('Warehouse #' + movement.warehouseId) }}</span>
            <span><app-movement-type-badge [type]="movement.movementType"></app-movement-type-badge></span>
            <span><app-movement-direction-badge [direction]="movement.direction"></app-movement-direction-badge></span>
            <span>{{ movement.quantity | number:'1.0-2' }}</span>
            <span>{{ movement.totalValue | currency:'INR':'symbol':'1.0-0' }}</span>
            <span>{{ movement.referenceNumber || movement.referenceId || '-' }}</span>
            <span class="actions">
              <a [routerLink]="['/movements', movement.movementId]">View</a>
              <button type="button" class="ghost" *ngIf="canReverse && !movement.isReversal" (click)="openReverseModal(movement)" [disabled]="actionLoadingId === movement.movementId">
                {{ actionLoadingId === movement.movementId ? 'Reversing...' : 'Reverse' }}
              </button>
            </span>
          </div>
        </div>

        <footer class="pager" *ngIf="pageData && pageData.totalPages > 1">
          <button type="button" class="ghost" (click)="changePage(pageData.number - 1)" [disabled]="pageData.first">Previous</button>
          <span>Page {{ pageData.number + 1 }} of {{ pageData.totalPages }}</span>
          <button type="button" class="ghost" (click)="changePage(pageData.number + 1)" [disabled]="pageData.last">Next</button>
        </footer>
      </section>
    </section>

    <app-movement-reversal-modal
      [open]="reversalOpen"
      [saving]="actionLoadingId === selectedMovement?.movementId"
      [movement]="selectedMovement"
      (cancel)="closeReverseModal()"
      (confirm)="reverseSelectedMovement($event)">
    </app-movement-reversal-modal>
  `,
  styles: [`
    .page { display:grid; gap:1.25rem; }
    .hero { display:flex; justify-content:space-between; gap:1rem; align-items:flex-start; padding:1.4rem; border-radius:28px; background:radial-gradient(circle at top left, #fdf2e4, #fff 42%, #eef4ff); border:1px solid #e8eef8; }
    .eyebrow { text-transform:uppercase; letter-spacing:0.14em; color:#9a3412; font-size:0.75rem; font-weight:700; }
    h1 { margin:0.2rem 0 0.5rem; font-size:2rem; color:#0f172a; }
    p { margin:0; color:#475569; }
    .hero-actions, .filter-actions, .pager, .actions { display:flex; gap:0.75rem; align-items:center; }
    button, .ghost, a { border:0; border-radius:14px; padding:0.8rem 1rem; font-weight:700; text-decoration:none; cursor:pointer; }
    button, a { background:#0f172a; color:#fff; }
    .ghost { background:#eef2ff; color:#1e293b; }
    .filters { display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:0.85rem; padding:1rem; background:#fff; border-radius:22px; border:1px solid #e5eaf3; }
    input, select { width:100%; border:1px solid #d9e1ee; border-radius:14px; padding:0.85rem 0.9rem; font:inherit; background:#fcfdff; }
    .filter-actions { grid-column:1 / -1; justify-content:flex-end; }
    .table-shell { background:#fff; border-radius:24px; border:1px solid #e5eaf3; padding:1rem; }
    .table-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem; }
    .table { display:grid; gap:0.6rem; }
    .row { display:grid; grid-template-columns:1.3fr 1fr 1fr 1fr 1fr 0.9fr 0.8fr 0.9fr 1fr 1fr; gap:0.6rem; align-items:center; padding:0.85rem 0.9rem; border-radius:18px; background:#f8fafc; }
    .row.head { background:#eff4fb; color:#334155; font-size:0.85rem; font-weight:700; }
    .row.reversal { border:1px solid #f9d7a2; background:#fff8ec; }
    .loading, .empty { padding:2rem; text-align:center; color:#64748b; }
    small { display:block; color:#b45309; font-weight:600; }
    @media (max-width: 1100px) {
      .row { grid-template-columns:repeat(2, minmax(0, 1fr)); }
      .row.head { display:none; }
    }
  `],
})
export class MovementListComponent implements OnInit {
  private readonly movementApi = inject(MovementApiService);
  private readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly canReverse = this.authService.hasRole([UserRole.ADMIN, UserRole.INVENTORY_MANAGER]);
  readonly canExport = this.authService.hasRole([UserRole.ADMIN, UserRole.INVENTORY_MANAGER]);
  readonly movementTypes = MOVEMENT_TYPE_OPTIONS;
  readonly movementDirections = MOVEMENT_DIRECTION_OPTIONS;
  readonly referenceTypes = REFERENCE_TYPE_OPTIONS;

  readonly filtersForm = this.fb.group({
    keyword: this.fb.control(''),
    productId: this.fb.control<number | null>(null),
    warehouseId: this.fb.control<number | null>(null),
    movementType: this.fb.control<string>(''),
    direction: this.fb.control<string>(''),
    referenceType: this.fb.control<string>(''),
    referenceId: this.fb.control(''),
    performedBy: this.fb.control<number | null>(null),
    fromDate: this.fb.control(''),
    toDate: this.fb.control(''),
  });

  movements: MovementResponse[] = [];
  summary: MovementSummaryResponse | null = null;
  pageData: PageResponse<MovementResponse> | null = null;
  query: MovementListQuery = { page: 0, size: 10, sortBy: 'movementDate', sortDir: 'desc' };
  loading = false;
  exporting = false;
  reversalOpen = false;
  selectedMovement: MovementResponse | null = null;
  actionLoadingId: number | null = null;

  ngOnInit(): void {
    this.loadSummary();
    this.loadMovements();
  }

  applyFilters(): void {
    const raw = this.filtersForm.getRawValue();
    this.query = {
      keyword: raw.keyword || undefined,
      productId: raw.productId ?? undefined,
      warehouseId: raw.warehouseId ?? undefined,
      movementType: (raw.movementType || undefined) as MovementListQuery['movementType'],
      direction: (raw.direction || undefined) as MovementListQuery['direction'],
      referenceType: (raw.referenceType || undefined) as MovementListQuery['referenceType'],
      referenceId: raw.referenceId || undefined,
      performedBy: raw.performedBy ?? undefined,
      fromDate: raw.fromDate ? `${raw.fromDate}T00:00:00` : undefined,
      toDate: raw.toDate ? `${raw.toDate}T23:59:59` : undefined,
      page: 0,
      size: this.query.size ?? 10,
      sortBy: this.query.sortBy ?? 'movementDate',
      sortDir: this.query.sortDir ?? 'desc',
    };
    this.loadMovements();
    this.loadSummary();
  }

  resetFilters(): void {
    this.filtersForm.reset({
      keyword: '',
      productId: null,
      warehouseId: null,
      movementType: '',
      direction: '',
      referenceType: '',
      referenceId: '',
      performedBy: null,
      fromDate: '',
      toDate: '',
    });
    this.query = { page: 0, size: 10, sortBy: 'movementDate', sortDir: 'desc' };
    this.loadMovements();
    this.loadSummary();
  }

  changePage(page: number): void {
    if (!this.pageData || page < 0 || page >= this.pageData.totalPages) {
      return;
    }
    this.query = { ...this.query, page };
    this.loadMovements();
  }

  openReverseModal(movement: MovementResponse): void {
    this.selectedMovement = movement;
    this.reversalOpen = true;
  }

  closeReverseModal(): void {
    this.reversalOpen = false;
    this.selectedMovement = null;
  }

  reverseSelectedMovement(request: ReverseMovementRequest): void {
    if (!this.selectedMovement) {
      return;
    }
    this.actionLoadingId = this.selectedMovement.movementId;
    this.movementApi.reverseMovement(this.selectedMovement.movementId, request).pipe(
      finalize(() => {
        this.actionLoadingId = null;
        this.closeReverseModal();
      })
    ).subscribe({
      next: () => {
        this.notification.success('Movement reversal created successfully');
        this.loadMovements();
        this.loadSummary();
      },
      error: () => this.notification.error('Unable to reverse movement. Please try again.'),
    });
  }

  exportCsv(): void {
    this.exporting = true;
    this.movementApi.exportCsv(this.query).pipe(finalize(() => (this.exporting = false))).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'movements-export.csv';
        anchor.click();
        window.URL.revokeObjectURL(url);
        this.notification.success('Movement history exported successfully');
      },
      error: () => this.notification.error('Unable to export movements'),
    });
  }

  private loadMovements(): void {
    this.loading = true;
    const request = this.hasActiveFilters() ? this.movementApi.searchMovements(this.query) : this.movementApi.getMovements(this.query);
    request.pipe(finalize(() => (this.loading = false))).subscribe({
      next: (pageData) => {
        this.pageData = pageData;
        this.movements = pageData.content ?? [];
      },
      error: () => {
        this.pageData = null;
        this.movements = [];
      },
    });
  }

  private loadSummary(): void {
    if (!this.canExport) {
      return;
    }
    const raw = this.filtersForm.getRawValue();
    this.movementApi.getMovementSummary(raw.fromDate || undefined, raw.toDate || undefined).subscribe({
      next: (summary) => (this.summary = summary),
      error: () => (this.summary = null),
    });
  }

  private hasActiveFilters(): boolean {
    return Boolean(
      this.query.keyword ||
      this.query.productId ||
      this.query.warehouseId ||
      this.query.movementType ||
      this.query.direction ||
      this.query.referenceType ||
      this.query.referenceId ||
      this.query.performedBy ||
      this.query.fromDate ||
      this.query.toDate
    );
  }
}
