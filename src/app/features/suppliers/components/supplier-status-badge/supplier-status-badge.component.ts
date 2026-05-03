import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SupplierStatus } from '../../../../core/http/backend.models';

@Component({
  selector: 'app-supplier-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './supplier-status-badge.component.html',
  styleUrls: ['./supplier-status-badge.component.css'],
})
export class SupplierStatusBadgeComponent {
  @Input({ required: true }) status: SupplierStatus | null = 'ACTIVE';
  @Input() isActive = true;

  get label(): string {
    if (!this.isActive && this.status === 'ACTIVE') {
      return 'INACTIVE';
    }
    return this.status ?? 'ACTIVE';
  }
}
