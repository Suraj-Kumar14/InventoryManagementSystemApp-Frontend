import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { PurchaseOrder } from '../../../core/models';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-receive-goods',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './receive-goods.component.html',
  styleUrls: ['./receive-goods.component.css']
})
export class ReceiveGoodsComponent implements OnInit {
  fb     = inject(FormBuilder);
  poSvc  = inject(PurchaseOrderService);
  route  = inject(ActivatedRoute);
  router = inject(Router);
  toast  = inject(ToastService);

  po      = signal<PurchaseOrder | null>(null);
  loading = signal(true);
  saving  = signal(false);

  form = this.fb.group({ receipts: this.fb.array([]) });
  get receipts(): FormArray { return this.form.get('receipts') as FormArray; }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.poSvc.getById(+id).subscribe({
      next: po => {
        this.po.set(po);
        po.items.forEach(item => {
          this.receipts.push(this.fb.group({
            purchaseOrderItemId: [item.id],
            productName:         [item.productName],
            orderedQuantity:     [item.orderedQuantity],
            receivedQuantity:    [item.orderedQuantity, [Validators.required, Validators.min(0)]]
          }));
        });
        this.loading.set(false);
      },
      error: () => { this.toast.error('PO not found'); this.router.navigate(['/purchase-orders']); }
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const items = this.receipts.value.map((r: { purchaseOrderItemId: number; receivedQuantity: number }) => ({
      purchaseOrderItemId: r.purchaseOrderItemId,
      receivedQuantity:    r.receivedQuantity
    }));
    this.poSvc.receiveGoods(this.po()!.id, items).subscribe({
      next: () => { this.toast.success('Goods received and stock updated!'); this.router.navigate(['/purchase-orders', this.po()!.id]); },
      error: err => { this.saving.set(false); this.toast.error('Receive failed', err.error?.message); }
    });
  }
}
