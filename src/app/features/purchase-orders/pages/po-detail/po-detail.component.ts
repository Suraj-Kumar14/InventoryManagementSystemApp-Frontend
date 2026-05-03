import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PurchaseOrderResponse } from '../../../../core/http/backend.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { PoStatusBadgeComponent } from '../../components/po-status-badge/po-status-badge.component';
import { PoTimelineComponent } from '../../components/po-timeline/po-timeline.component';
import { PurchaseOrderApiService } from '../../services/purchase-order-api.service';

@Component({
  selector: 'app-po-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, PoStatusBadgeComponent, PoTimelineComponent],
  templateUrl: './po-detail.component.html',
  styleUrls: ['./po-detail.component.css'],
})
export class PoDetailComponent implements OnInit {
  private readonly purchaseApi = inject(PurchaseOrderApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly notifications = inject(NotificationService);

  purchaseOrder: PurchaseOrderResponse | null = null;
  loading = false;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading = true;
    this.purchaseApi.getPurchaseOrderById(id).subscribe({
      next: (order) => {
        this.purchaseOrder = order;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  submitPurchaseOrder(): void {
    if (!this.purchaseOrder) {
      return;
    }
    this.purchaseApi.submitPurchaseOrder(this.purchaseOrder.purchaseOrderId ?? this.purchaseOrder.poId, {}).subscribe({
      next: (order) => {
        this.purchaseOrder = order;
        this.notifications.success('Purchase order submitted for approval');
      },
    });
  }

  approvePurchaseOrder(): void {
    if (!this.purchaseOrder) {
      return;
    }
    const approvalRemarks = window.prompt('Approval remarks (optional):') ?? '';
    this.purchaseApi.approvePurchaseOrder(this.purchaseOrder.purchaseOrderId ?? this.purchaseOrder.poId, { approvalRemarks }).subscribe({
      next: (order) => {
        this.purchaseOrder = order;
        this.notifications.success('Purchase order approved successfully');
      },
    });
  }

  rejectPurchaseOrder(): void {
    if (!this.purchaseOrder) {
      return;
    }
    const rejectionReason = window.prompt('Rejection reason is required:');
    if (!rejectionReason) {
      return;
    }
    this.purchaseApi.rejectPurchaseOrder(this.purchaseOrder.purchaseOrderId ?? this.purchaseOrder.poId, { rejectionReason }).subscribe({
      next: (order) => {
        this.purchaseOrder = order;
        this.notifications.success('Purchase order rejected successfully');
      },
    });
  }

  cancelPurchaseOrder(): void {
    if (!this.purchaseOrder) {
      return;
    }
    const cancellationReason = window.prompt('Cancellation reason is required:');
    if (!cancellationReason) {
      return;
    }
    this.purchaseApi.cancelPurchaseOrder(this.purchaseOrder.purchaseOrderId ?? this.purchaseOrder.poId, { cancellationReason }).subscribe({
      next: (order) => {
        this.purchaseOrder = order;
        this.notifications.success('Purchase order cancelled successfully');
      },
    });
  }
}
