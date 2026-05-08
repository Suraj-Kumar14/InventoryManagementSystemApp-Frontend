import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { PurchaseOrderResponse } from '../../../../core/http/backend.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { PoStatusBadgeComponent } from '../../components/po-status-badge/po-status-badge.component';
import { PurchaseOrderApiService } from '../../services/purchase-order-api.service';

@Component({
  selector: 'app-po-approvals',
  standalone: true,
  imports: [CommonModule, RouterLink, PoStatusBadgeComponent],
  templateUrl: './po-approvals.component.html',
  styleUrls: ['./po-approvals.component.css'],
})
export class PoApprovalsComponent implements OnInit {
  private readonly purchaseApi = inject(PurchaseOrderApiService);
  private readonly notifications = inject(NotificationService);

  purchaseOrders: PurchaseOrderResponse[] = [];
  loading = false;
  actionLoadingId: number | null = null;

  ngOnInit(): void {
    this.loadPurchaseOrders();
  }

  paymentReadyLabel(order: PurchaseOrderResponse): string {
    if (order.paymentCompleted) {
      return 'Payment Completed';
    }

    if (order.paymentStatus) {
      return order.paymentStatus.replace(/_/g, ' ');
    }

    return order.status === 'PENDING_APPROVAL' ? 'Ready for Approval' : 'Payment Pending';
  }

  approve(order: PurchaseOrderResponse): void {
    const approvalRemarks = window.prompt('Approval remarks (optional):') ?? '';
    this.actionLoadingId = order.purchaseOrderId ?? order.poId;
    this.purchaseApi.approvePurchaseOrder(order.purchaseOrderId ?? order.poId, { approvalRemarks })
      .pipe(finalize(() => (this.actionLoadingId = null)))
      .subscribe({
        next: () => {
          this.notifications.success('Purchase order approved successfully');
          this.loadPurchaseOrders();
        },
      });
  }

  reject(order: PurchaseOrderResponse): void {
    const rejectionReason = window.prompt('Rejection reason is required:');
    if (!rejectionReason) {
      return;
    }
    this.actionLoadingId = order.purchaseOrderId ?? order.poId;
    this.purchaseApi.rejectPurchaseOrder(order.purchaseOrderId ?? order.poId, { rejectionReason })
      .pipe(finalize(() => (this.actionLoadingId = null)))
      .subscribe({
        next: () => {
          this.notifications.success('Purchase order rejected successfully');
          this.loadPurchaseOrders();
        },
      });
  }

  private loadPurchaseOrders(): void {
    this.loading = true;
    this.purchaseApi.getPendingApprovalPurchaseOrders()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (orders) => (this.purchaseOrders = orders),
        error: () => (this.purchaseOrders = []),
      });
  }
}
