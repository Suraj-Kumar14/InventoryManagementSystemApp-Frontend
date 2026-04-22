import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state">
      <div class="empty-state-icon">{{ icon }}</div>
      <div class="empty-state-title">{{ title }}</div>
      @if (description) {
        <div class="empty-state-desc">{{ description }}</div>
      }
      <div class="empty-state-action">
        <ng-content />
      </div>
    </div>
  `
})
export class EmptyStateComponent {
  @Input() icon = '📭';
  @Input() title = 'No data found';
  @Input() description = '';
}
