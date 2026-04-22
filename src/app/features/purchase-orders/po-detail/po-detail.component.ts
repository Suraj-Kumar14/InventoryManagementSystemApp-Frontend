import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { PurchaseOrder, PoStatus } from '../../../core/models';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-po-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ConfirmDialogComponent, ModalComponent],
  templateUrl: './po-detail.component.html',
  styleUrls: ['./po-detail.component.css']
})
export class PoDetailComponent implements OnInit {
  poSvc   = inject(PurchaseOrderService);
  route   = inject(ActivatedRoute);
  router  = inject(Router);
  toast   = inject(ToastService);

  po          = signal<PurchaseOrder | null>(null);
  loading     = signal(true);
  actionModal = signal<'approve' | 'reject' | 'cancel' | null>(null);
  actionNote  = '';
  actioning   = signal(false);

  readonly timeline: { status: PoStatus; label: string; icon: string }[] = [
    { status: 'DRAFT',            label: 'Draft',            icon: '📝' },
    { status: 'PENDING_APPROVAL', label: 'Pending Approval', icon: '⏳' },
    { status: 'APPROVED',         label: 'Approved',         icon: '✅' },
    { status: 'RECEIVED',         label: 'Received',         icon: '📦' },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.poSvc.getById(+id).subscribe({
      next: po => { this.po.set(po); this.loading.set(false); },
      error: () => { this.toast.error('PO not found'); this.router.navigate(['/purchase-orders']); }
    });
  }

  statusIndex(status: PoStatus): number {
    const order: PoStatus[] = ['DRAFT','PENDING_APPROVAL','APPROVED','RECEIVED'];
    return order.indexOf(status);
  }

  openAction(type: 'approve' | 'reject' | 'cancel'): void { this.actionNote = ''; this.actionModal.set(type); }

  executeAction(): void {
    const po   = this.po();
    const type = this.actionModal();
    if (!po || !type) return;
    this.actioning.set(true);
    let op$;
    if (type === 'approve') op$ = this.poSvc.approve(po.id, this.actionNote);
    else if (type === 'reject') op$ = this.poSvc.reject(po.id, this.actionNote);
    else op$ = this.poSvc.cancel(po.id, this.actionNote);

    op$.subscribe({
      next: updated => {
        this.po.set(updated);
        this.toast.success(`PO ${type}d successfully`);
        this.actionModal.set(null);
        this.actioning.set(false);
      },
      error: err => { this.toast.error('Action failed', err.error?.message); this.actioning.set(false); }
    });
  }

  getBadgeClass(status: PoStatus): string {
    const map: Record<PoStatus, string> = {
      DRAFT: 'badge-gray', PENDING_APPROVAL: 'badge-warning', APPROVED: 'badge-primary',
      RECEIVED: 'badge-success', CANCELLED: 'badge-danger', REJECTED: 'badge-danger'
    };
    return map[status] ?? 'badge-gray';
  }
}
