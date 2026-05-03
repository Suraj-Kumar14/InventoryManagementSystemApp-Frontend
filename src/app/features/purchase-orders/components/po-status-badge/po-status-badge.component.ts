import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-po-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './po-status-badge.component.html',
  styleUrls: ['./po-status-badge.component.css'],
})
export class PoStatusBadgeComponent {
  @Input({ required: true }) status = 'DRAFT';
  @Input() overdue = false;

  get badgeClass(): string {
    switch (this.status) {
      case 'APPROVED':
        return 'badge badge--approved';
      case 'PENDING_APPROVAL':
        return 'badge badge--pending';
      case 'PARTIALLY_RECEIVED':
        return 'badge badge--partial';
      case 'RECEIVED':
        return 'badge badge--received';
      case 'REJECTED':
        return 'badge badge--rejected';
      case 'CANCELLED':
        return 'badge badge--cancelled';
      default:
        return 'badge badge--draft';
    }
  }
}
