import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MovementResponse, ReverseMovementRequest } from '../../../../core/http/backend.models';
import { MOVEMENT_REASON_OPTIONS } from '../../models/movement.model';

@Component({
  selector: 'app-movement-reversal-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="backdrop" *ngIf="open">
      <div class="modal">
        <header>
          <h3>Reverse Movement</h3>
          <button type="button" (click)="cancel.emit()">x</button>
        </header>
        <p *ngIf="movement">Creating a reversal for <strong>{{ movement.movementNumber }}</strong>. The original record will remain immutable.</p>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <label>
            <span>Reason Code</span>
            <select formControlName="reasonCode">
              <option value="">Select reason</option>
              <option *ngFor="let reason of reasonOptions" [value]="reason">{{ reason }}</option>
            </select>
          </label>
          <label>
            <span>Notes</span>
            <textarea formControlName="notes" rows="4" placeholder="Why is this correction needed?"></textarea>
          </label>
          <p class="error" *ngIf="form.controls.reasonCode.invalid && form.controls.reasonCode.touched">Reversal reason is required.</p>
          <footer>
            <button type="button" class="ghost" (click)="cancel.emit()">Cancel</button>
            <button type="submit" [disabled]="saving || form.invalid">{{ saving ? 'Reversing...' : 'Reverse Movement' }}</button>
          </footer>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .backdrop { position:fixed; inset:0; background:rgba(15,23,42,0.55); display:grid; place-items:center; padding:1rem; z-index:1000; }
    .modal { width:min(100%, 520px); background:#fff; border-radius:24px; padding:1.25rem; box-shadow:0 30px 80px rgba(15,23,42,0.28); }
    header, footer { display:flex; justify-content:space-between; align-items:center; gap:1rem; }
    h3 { margin:0; color:#0f172a; }
    button { border:0; border-radius:12px; padding:0.8rem 1rem; font-weight:700; cursor:pointer; background:#0f172a; color:#fff; }
    .ghost { background:#eef2ff; color:#1e293b; }
    label { display:block; margin-top:1rem; }
    label span { display:block; margin-bottom:0.4rem; color:#475569; font-size:0.9rem; }
    select, textarea { width:100%; border:1px solid #d9e1ee; border-radius:14px; padding:0.8rem 0.9rem; font:inherit; }
    .error { color:#b42318; font-size:0.85rem; }
  `],
})
export class MovementReversalModalComponent {
  @Input() open = false;
  @Input() saving = false;
  @Input() movement: MovementResponse | null = null;
  @Output() cancel = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<ReverseMovementRequest>();

  private readonly fb = inject(FormBuilder);
  readonly reasonOptions = MOVEMENT_REASON_OPTIONS;
  readonly form = this.fb.nonNullable.group({
    reasonCode: ['', Validators.required],
    notes: [''],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue) {
      this.form.reset({ reasonCode: '', notes: '' });
    }
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const raw = this.form.getRawValue();
    this.confirm.emit({ reasonCode: raw.reasonCode as ReverseMovementRequest['reasonCode'], notes: raw.notes || null });
  }
}
