import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PageResponse, MovementResponse } from '../../../../core/http/backend.models';
import { MovementApiService } from '../../services/movement-api.service';

@Component({
  selector: 'app-movement-reference',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page">
      <a routerLink="/movements" class="back">Back to movement history</a>
      <h1>Reference movement trail</h1>
      <p *ngIf="referenceType && referenceId">Showing movements for {{ referenceType }} / {{ referenceId }}.</p>
      <div class="list" *ngIf="pageData as data; else emptyTpl">
        <article class="item" *ngFor="let movement of data.content">
          <div><strong>{{ movement.movementNumber }}</strong><p>{{ movement.productName || ('Product #' + movement.productId) }}</p></div>
          <div>{{ movement.movementType }}</div>
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
export class MovementReferenceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly movementApi = inject(MovementApiService);
  referenceType = '';
  referenceId = '';
  pageData: PageResponse<MovementResponse> | null = null;

  ngOnInit(): void {
    this.referenceType = this.route.snapshot.paramMap.get('referenceType') ?? '';
    this.referenceId = this.route.snapshot.paramMap.get('referenceId') ?? '';
    if (this.referenceType && this.referenceId) {
      this.movementApi.getMovementsByReference(this.referenceType, this.referenceId).subscribe({
        next: (page) => (this.pageData = page),
        error: () => (this.pageData = null),
      });
    }
  }
}
