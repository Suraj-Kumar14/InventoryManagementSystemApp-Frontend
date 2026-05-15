import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PurchaseOrderResponse } from '../../../../core/http/backend.models';
import { PoStatusBadgeComponent } from '../../components/po-status-badge/po-status-badge.component';
import { PurchaseOrderApiService } from '../../services/purchase-order-api.service';

@Component({
  selector: 'app-po-overdue',
  standalone: true,
  imports: [CommonModule, RouterLink, PoStatusBadgeComponent],
  templateUrl: './po-overdue.component.html',
  styleUrls: ['./po-overdue.component.css'],
})
export class PoOverdueComponent implements OnInit {
  private readonly purchaseApi = inject(PurchaseOrderApiService);

  purchaseOrders: PurchaseOrderResponse[] = [];
  loading = false;

  ngOnInit(): void {
    this.loading = true;
    this.purchaseApi.getOverduePurchaseOrders().subscribe({
      next: (orders) => {
        this.purchaseOrders = orders;
        this.loading = false;
      },
      error: () => {
        this.purchaseOrders = [];
        this.loading = false;
      },
    });
  }
}
