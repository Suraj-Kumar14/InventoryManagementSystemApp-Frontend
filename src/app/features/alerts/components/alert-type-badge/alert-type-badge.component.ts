import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AlertType } from '../../../../core/http/backend.models';

@Component({
  selector: 'app-alert-type-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="type-badge">{{ label }}</span>`,
  styles: [`
    .type-badge { display:inline-flex; align-items:center; border-radius:999px; padding:0.28rem 0.7rem; font-size:0.75rem; font-weight:600; background:#eff6ff; color:#1d4ed8; }
  `],
})
export class AlertTypeBadgeComponent {
  @Input({ required: true }) type!: AlertType;

  get label(): string {
    return this.type.replace(/_/g, ' ');
  }
}
