import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MovementType } from '../../../../core/http/backend.models';

@Component({
  selector: 'app-movement-type-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="badge" [ngClass]="typeClass">{{ typeLabel }}</span>`,
  styles: [`
    .badge { display:inline-flex; align-items:center; border-radius:999px; padding:0.35rem 0.75rem; font-size:0.75rem; font-weight:700; letter-spacing:0.04em; }
    .tone-in { background:#e7f7ef; color:#0d7a46; }
    .tone-out { background:#fff1f0; color:#b42318; }
    .tone-transfer { background:#eef4ff; color:#1d4ed8; }
    .tone-neutral { background:#f4f4f5; color:#27272a; }
  `],
})
export class MovementTypeBadgeComponent {
  @Input({ required: true }) type!: MovementType;

  get typeLabel(): string {
    return this.type.replace(/_/g, ' ');
  }

  get typeClass(): string {
    if (this.type.includes('IN')) return 'tone-in';
    if (this.type.includes('OUT') || this.type === 'WRITE_OFF') return 'tone-out';
    if (this.type.includes('TRANSFER')) return 'tone-transfer';
    return 'tone-neutral';
  }
}
