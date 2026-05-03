import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PageResponse, MovementResponse } from '../../../../core/http/backend.models';
import { MovementApiService } from '../../services/movement-api.service';
import { MovementTypeBadgeComponent } from '../../components/movement-type-badge/movement-type-badge.component';

@Component({
  selector: 'app-movement-by-product',
  standalone: true,
  imports: [CommonModule, RouterLink, MovementTypeBadgeComponent],
  template: `
    <section class="page">
      <a routerLink="/movements" class="back">Back to movement history</a>
      <h1>Product movement timeline</h1>
      <p *ngIf="productId">Showing immutable movement history for product #{{ productId }}.</p>
      <div class="list" *ngIf="pageData as data; else emptyTpl">
        <article class="item" *ngFor="let movement of data.content">
          <div><strong>{{ movement.movementNumber }}</strong><p>{{ movement.movementDate | date:'medium' }}</p></div>
          <app-movement-type-badge [type]="movement.movementType"></app-movement-type-badge>
          <div>{{ movement.quantity | number:'1.0-2' }} units</div>
        </article>
      </div>
      <ng-template #emptyTpl><div class="empty">No stock movements found for the selected filters.</div></ng-template>
    </section>
  `,
  styles: [`
    .page { display:grid; gap:1rem; }
    .item, .empty { background:#fff; border:1px solid #e5eaf3; border-radius:20px; padding:1rem; display:flex; justify-content:space-between; gap:1rem; align-items:center; }
    .back { color:#1d4ed8; text-decoration:none; font-weight:700; }
    p { margin:0.25rem 0 0; color:#64748b; }
  `],
})
export class MovementByProductComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly movementApi = inject(MovementApiService);
  productId: number | null = null;
  pageData: PageResponse<MovementResponse> | null = null;

  ngOnInit(): void {
    this.productId = Number(this.route.snapshot.paramMap.get('productId'));
    if (this.productId) {
      this.movementApi.getMovementsByProduct(this.productId).subscribe({
        next: (page) => (this.pageData = page),
        error: () => (this.pageData = null),
      });
    }
  }
}
