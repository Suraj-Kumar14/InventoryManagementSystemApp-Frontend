import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { MovementResponse, ReverseMovementRequest } from '../../../../core/http/backend.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserRole } from '../../../../shared/config/app-config';
import { MovementDirectionBadgeComponent } from '../../components/movement-direction-badge/movement-direction-badge.component';
import { MovementReversalModalComponent } from '../../components/movement-reversal-modal/movement-reversal-modal.component';
import { MovementTypeBadgeComponent } from '../../components/movement-type-badge/movement-type-badge.component';
import { MovementApiService } from '../../services/movement-api.service';

@Component({
  selector: 'app-movement-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MovementTypeBadgeComponent, MovementDirectionBadgeComponent, MovementReversalModalComponent],
  template: `
    <section class="detail-shell" *ngIf="movement as item; else stateTpl">
      <header class="header-card">
        <div>
          <p class="eyebrow">Movement Detail</p>
          <h1>{{ item.movementNumber }}</h1>
          <p>{{ item.movementDate | date:'full' }}</p>
        </div>
        <div class="actions">
          <a routerLink="/movements" class="ghost">Back to history</a>
          <button *ngIf="canReverse && !item.isReversal" type="button" (click)="reversalOpen = true" [disabled]="saving">
            {{ saving ? 'Reversing...' : 'Reverse Movement' }}
          </button>
        </div>
      </header>

      <section class="grid">
        <article class="card">
          <h2>Movement</h2>
          <div class="kv"><span>Type</span><app-movement-type-badge [type]="item.movementType"></app-movement-type-badge></div>
          <div class="kv"><span>Direction</span><app-movement-direction-badge [direction]="item.direction"></app-movement-direction-badge></div>
          <div class="kv"><span>Quantity</span><strong>{{ item.quantity | number:'1.0-2' }}</strong></div>
          <div class="kv"><span>Unit Cost</span><strong>{{ item.unitCost | currency:'INR':'symbol':'1.0-0' }}</strong></div>
          <div class="kv"><span>Total Value</span><strong>{{ item.totalValue | currency:'INR':'symbol':'1.0-0' }}</strong></div>
          <div class="kv"><span>Balance After</span><strong>{{ item.balanceAfter | number:'1.0-2' }}</strong></div>
        </article>

        <article class="card">
          <h2>Context</h2>
          <div class="kv"><span>Product</span><strong>{{ item.productName || ('Product #' + item.productId) }}</strong></div>
          <div class="kv"><span>Warehouse</span><strong>{{ item.warehouseName || ('Warehouse #' + item.warehouseId) }}</strong></div>
          <div class="kv"><span>Reference</span><strong>{{ item.referenceNumber || item.referenceId || '-' }}</strong></div>
          <div class="kv"><span>Performed By</span><strong>{{ item.performedByName || ('User #' + item.performedBy) }}</strong></div>
          <div class="kv"><span>Reason Code</span><strong>{{ item.reasonCode || '-' }}</strong></div>
          <div class="kv"><span>Source Service</span><strong>{{ item.sourceService || '-' }}</strong></div>
          <div class="kv"><span>Correlation ID</span><strong>{{ item.correlationId || '-' }}</strong></div>
        </article>

        <article class="card wide">
          <h2>Notes</h2>
          <p>{{ item.notes || 'No notes were recorded for this movement.' }}</p>
          <p *ngIf="item.relatedMovementId">
            Related movement:
            <a [routerLink]="['/movements', item.relatedMovementId]">#{{ item.relatedMovementId }}</a>
          </p>
        </article>
      </section>
    </section>

    <ng-template #stateTpl>
      <div class="state">{{ loading ? 'Loading movement detail...' : 'Unable to load movement history. Please try again.' }}</div>
    </ng-template>

    <app-movement-reversal-modal
      [open]="reversalOpen"
      [saving]="saving"
      [movement]="movement"
      (cancel)="reversalOpen = false"
      (confirm)="reverseMovement($event)">
    </app-movement-reversal-modal>
  `,
  styles: [`
    .detail-shell { display:grid; gap:1rem; }
    .header-card, .card { background:#fff; border:1px solid #e5eaf3; border-radius:24px; padding:1.25rem; }
    .header-card { display:flex; justify-content:space-between; gap:1rem; align-items:flex-start; background:linear-gradient(135deg, #fff7ed, #ffffff 60%, #eef4ff); }
    .eyebrow { text-transform:uppercase; font-weight:700; letter-spacing:0.12em; color:#c2410c; margin:0; font-size:0.75rem; }
    h1, h2 { margin:0.2rem 0 0.5rem; color:#0f172a; }
    p { margin:0; color:#475569; }
    .actions { display:flex; gap:0.75rem; }
    button, .ghost { border:0; border-radius:14px; padding:0.8rem 1rem; font-weight:700; text-decoration:none; cursor:pointer; }
    button { background:#0f172a; color:#fff; }
    .ghost { background:#eef2ff; color:#1e293b; }
    .grid { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:1rem; }
    .wide { grid-column:1 / -1; }
    .kv { display:flex; justify-content:space-between; gap:1rem; padding:0.7rem 0; border-bottom:1px solid #eef2f7; }
    .kv:last-child { border-bottom:0; }
    .state { padding:2rem; text-align:center; color:#64748b; background:#fff; border-radius:20px; }
    @media (max-width: 800px) { .grid { grid-template-columns:1fr; } .header-card { flex-direction:column; } }
  `],
})
export class MovementDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly movementApi = inject(MovementApiService);
  private readonly notification = inject(NotificationService);
  private readonly authService = inject(AuthService);

  readonly canReverse = this.authService.hasRole([UserRole.ADMIN, UserRole.INVENTORY_MANAGER]);
  movement: MovementResponse | null = null;
  loading = false;
  saving = false;
  reversalOpen = false;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadMovement(id);
    }
  }

  reverseMovement(request: ReverseMovementRequest): void {
    if (!this.movement) {
      return;
    }
    this.saving = true;
    this.movementApi.reverseMovement(this.movement.movementId, request).pipe(finalize(() => {
      this.saving = false;
      this.reversalOpen = false;
    })).subscribe({
      next: (movement) => {
        this.notification.success('Movement reversal created successfully');
        this.loadMovement(movement.movementId);
      },
      error: () => this.notification.error('Unable to reverse movement. Please try again.'),
    });
  }

  private loadMovement(id: number): void {
    this.loading = true;
    this.movementApi.getMovementById(id).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (movement) => (this.movement = movement),
      error: () => (this.movement = null),
    });
  }
}
