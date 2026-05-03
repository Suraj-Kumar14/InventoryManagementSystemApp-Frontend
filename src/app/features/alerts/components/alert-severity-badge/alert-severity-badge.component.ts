import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AlertSeverity } from '../../../../core/http/backend.models';

@Component({
  selector: 'app-alert-severity-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="severity-badge" [ngClass]="severityClass">{{ severity }}</span>`,
  styles: [`
    .severity-badge { display:inline-flex; align-items:center; border-radius:999px; padding:0.28rem 0.7rem; font-size:0.75rem; font-weight:700; letter-spacing:0.04em; }
    .severity-badge--info { background:#e0f2fe; color:#075985; }
    .severity-badge--warning { background:#fef3c7; color:#92400e; }
    .severity-badge--critical { background:#fee2e2; color:#b91c1c; }
  `],
})
export class AlertSeverityBadgeComponent {
  @Input({ required: true }) severity!: AlertSeverity;

  get severityClass(): string {
    return `severity-badge--${this.severity.toLowerCase()}`;
  }
}
