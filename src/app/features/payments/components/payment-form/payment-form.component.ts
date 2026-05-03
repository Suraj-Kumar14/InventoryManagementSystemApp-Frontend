import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PurchaseOrderResponse } from '../../../../core/http/backend.models';
import { PaymentService } from '../../../../core/services/payment.service';
import { PaymentMethod, PaymentResponse } from '../../models/payment.model';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe],
  template: `
    <form [formGroup]="form" class="payment-form" (ngSubmit)="emitSave(false)">
      <div class="form-grid">
        <label class="field field--wide">
          <span>Purchase Order</span>
          <select formControlName="purchaseOrderId" [disabled]="mode === 'edit'">
            <option [ngValue]="null">Select received purchase order</option>
            <option *ngFor="let po of purchaseOrders" [ngValue]="po.purchaseOrderId || po.poId">
              {{ po.poNumber || ('PO #' + (po.purchaseOrderId || po.poId)) }} · {{ po.supplierName || 'Supplier' }}
            </option>
          </select>
        </label>
        <label class="field">
          <span>Amount</span>
          <input type="number" formControlName="paymentAmount" min="0.01" step="0.01" />
        </label>
        <label class="field">
          <span>Method</span>
          <select formControlName="paymentMethod">
            <option *ngFor="let option of methods" [ngValue]="option">{{ option.replaceAll('_', ' ') }}</option>
          </select>
        </label>
        <label class="field">
          <span>Payment Date</span>
          <input type="date" formControlName="paymentDate" />
        </label>
        <label class="field">
          <span>Transaction Reference</span>
          <input type="text" formControlName="transactionReference" />
        </label>
        <label class="field">
          <span>Bank Reference</span>
          <input type="text" formControlName="bankReference" />
        </label>
        <label class="field field--wide">
          <span>Remarks</span>
          <textarea rows="4" formControlName="remarks"></textarea>
        </label>
      </div>

      <section class="po-card" *ngIf="selectedOrder">
        <div>
          <p class="eyebrow">Purchase order</p>
          <h3>{{ selectedOrder.poNumber || ('PO #' + (selectedOrder.purchaseOrderId || selectedOrder.poId)) }}</h3>
          <p>{{ selectedOrder.supplierName || 'Supplier' }} · Status {{ selectedOrder.status }}</p>
        </div>
        <div class="po-stats">
          <div>
            <span>Total</span>
            <strong>{{ selectedOrder.totalAmount | currency:'INR':'symbol':'1.0-2' }}</strong>
          </div>
          <div>
            <span>Previously Paid</span>
            <strong>{{ paidAmount | currency:'INR':'symbol':'1.0-2' }}</strong>
          </div>
          <div>
            <span>Remaining</span>
            <strong>{{ remainingAmount | currency:'INR':'symbol':'1.0-2' }}</strong>
          </div>
        </div>
      </section>

      <p class="error" *ngIf="form.invalid && form.touched">Please fill the required fields and keep amount within the remaining payable balance.</p>

      <div class="actions">
        <button type="submit" class="primary" [disabled]="busy || form.invalid">{{ busy ? savingLabel : primaryLabel }}</button>
        <button type="button" class="secondary" *ngIf="mode === 'create'" (click)="emitSave(true)" [disabled]="busy || form.invalid">
          {{ busy ? 'Submitting...' : 'Save & Submit' }}
        </button>
      </div>
    </form>
  `,
  styles: [`
    .payment-form { display:grid; gap:1.25rem; }
    .form-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:1rem; }
    .field { display:grid; gap:0.4rem; color:#0f172a; }
    .field--wide { grid-column:1 / -1; }
    .field span { font-size:0.85rem; font-weight:700; color:#475569; }
    .field input, .field select, .field textarea {
      width:100%; border:1px solid #cbd5e1; border-radius:0.85rem; padding:0.85rem 0.9rem; background:#fff;
    }
    .po-card { display:flex; justify-content:space-between; gap:1rem; flex-wrap:wrap; padding:1rem 1.2rem; border-radius:1rem; background:linear-gradient(155deg, #eff6ff, #f8fafc); border:1px solid #bfdbfe; }
    .eyebrow { margin:0; text-transform:uppercase; letter-spacing:0.08em; color:#64748b; font-size:0.75rem; }
    .po-card h3 { margin:0.3rem 0; }
    .po-card p { margin:0; color:#334155; }
    .po-stats { display:grid; grid-template-columns:repeat(3, minmax(130px, 1fr)); gap:0.8rem; }
    .po-stats div { padding:0.85rem; border-radius:0.9rem; background:#fff; border:1px solid #dbeafe; }
    .po-stats span { display:block; font-size:0.75rem; color:#64748b; text-transform:uppercase; }
    .po-stats strong { display:block; margin-top:0.35rem; font-size:1rem; }
    .actions { display:flex; gap:0.75rem; flex-wrap:wrap; }
    .actions button { border:none; border-radius:999px; padding:0.85rem 1.2rem; font-weight:700; cursor:pointer; }
    .primary { background:#0f766e; color:#fff; }
    .secondary { background:#e2e8f0; color:#0f172a; }
    .error { margin:0; color:#b91c1c; }
  `],
})
export class PaymentFormComponent implements OnInit, OnChanges {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() purchaseOrders: PurchaseOrderResponse[] = [];
  @Input() payment: PaymentResponse | null = null;
  @Input() initialPurchaseOrderId: number | null = null;
  @Input() busy = false;
  @Output() saveDraft = new EventEmitter<ReturnType<PaymentFormComponent['buildPayload']>>();
  @Output() saveAndSubmit = new EventEmitter<ReturnType<PaymentFormComponent['buildPayload']>>();

  private readonly fb = inject(FormBuilder);
  private readonly paymentService = inject(PaymentService);

  readonly methods: PaymentMethod[] = ['BANK_TRANSFER', 'NEFT', 'RTGS', 'IMPS', 'UPI', 'CHEQUE', 'CARD', 'CASH', 'OTHER'];

  selectedOrder: PurchaseOrderResponse | null = null;
  paidAmount = 0;
  remainingAmount = 0;

  readonly form = this.fb.group({
    purchaseOrderId: [null as number | null, Validators.required],
    paymentAmount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    paymentMethod: ['NEFT' as PaymentMethod, Validators.required],
    paymentDate: [''],
    transactionReference: [''],
    bankReference: [''],
    remarks: [''],
  });

  ngOnInit(): void {
    this.form.controls.purchaseOrderId.valueChanges.subscribe((purchaseOrderId) => {
      if (purchaseOrderId) {
        this.selectedOrder = this.purchaseOrders.find((item) => (item.purchaseOrderId || item.poId) === purchaseOrderId) || null;
        this.loadAmounts(purchaseOrderId);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['payment'] && this.payment) {
      this.form.patchValue({
        purchaseOrderId: this.payment.purchaseOrderId,
        paymentAmount: this.payment.paymentAmount,
        paymentMethod: this.payment.paymentMethod,
        paymentDate: this.payment.paymentDate || '',
        transactionReference: this.payment.transactionReference || '',
        bankReference: this.payment.bankReference || '',
        remarks: this.payment.remarks || '',
      });
      this.selectedOrder = this.purchaseOrders.find((item) => (item.purchaseOrderId || item.poId) === this.payment?.purchaseOrderId) || null;
      this.loadAmounts(this.payment.purchaseOrderId);
    }
    if (changes['initialPurchaseOrderId'] && this.initialPurchaseOrderId && !this.payment) {
      this.form.patchValue({ purchaseOrderId: this.initialPurchaseOrderId });
      this.selectedOrder = this.purchaseOrders.find((item) => (item.purchaseOrderId || item.poId) === this.initialPurchaseOrderId) || null;
      this.loadAmounts(this.initialPurchaseOrderId);
    }
  }

  get primaryLabel(): string {
    return this.mode === 'edit' ? 'Update Payment' : 'Save Draft';
  }

  get savingLabel(): string {
    return this.mode === 'edit' ? 'Updating...' : 'Saving...';
  }

  emitSave(submitAfterSave: boolean): void {
    this.form.markAllAsTouched();
    const purchaseOrderId = this.form.controls.purchaseOrderId.value;
    const paymentAmount = Number(this.form.controls.paymentAmount.value);
    if (!purchaseOrderId || !paymentAmount || paymentAmount > this.remainingAmount + (this.mode === 'edit' ? this.payment?.paymentAmount ?? 0 : 0)) {
      return;
    }

    const payload = this.buildPayload();
    if (submitAfterSave) {
      this.saveAndSubmit.emit(payload);
      return;
    }
    this.saveDraft.emit(payload);
  }

  private buildPayload() {
    const value = this.form.getRawValue();
    return {
      purchaseOrderId: Number(value.purchaseOrderId),
      paymentAmount: Number(value.paymentAmount),
      paymentMethod: value.paymentMethod as PaymentMethod,
      paymentDate: value.paymentDate || null,
      transactionReference: value.transactionReference || null,
      bankReference: value.bankReference || null,
      remarks: value.remarks || null,
    };
  }

  private loadAmounts(purchaseOrderId: number): void {
    forkJoin({
      paid: this.paymentService.getPaidAmountForPurchaseOrder(purchaseOrderId),
      remaining: this.paymentService.getRemainingAmountForPurchaseOrder(purchaseOrderId),
    }).subscribe({
      next: ({ paid, remaining }) => {
        this.paidAmount = paid;
        this.remainingAmount = remaining;
      },
      error: () => {
        this.paidAmount = 0;
        this.remainingAmount = this.selectedOrder?.totalAmount ?? 0;
      },
    });
  }
}
