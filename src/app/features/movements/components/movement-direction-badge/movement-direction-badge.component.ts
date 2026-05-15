import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MovementDirection } from '../../../../core/http/backend.models';

@Component({
  selector: 'app-movement-direction-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="badge" [ngClass]="directionClass">{{ direction }}</span>`,
  styles: [`
    .badge { display:inline-flex; border-radius:999px; padding:0.3rem 0.65rem; font-size:0.75rem; font-weight:700; }
    .in { background:#dff8eb; color:#0d7a46; }
    .out { background:#fde8e8; color:#b42318; }
    .neutral { background:#f4f4f5; color:#3f3f46; }
  `],
})
export class MovementDirectionBadgeComponent {
  @Input({ required: true }) direction!: MovementDirection;

  get directionClass(): string {
    return this.direction.toLowerCase();
  }
}
