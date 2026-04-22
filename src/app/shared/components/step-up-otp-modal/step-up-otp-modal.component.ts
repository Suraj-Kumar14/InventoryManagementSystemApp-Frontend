import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-step-up-otp-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen">
      <div class="modal-container" style="max-width: 400px;">
        <div class="modal-header">
          <h3 class="modal-title text-danger">⚠️ Security Verification</h3>
          <button class="btn btn-icon-sm btn-ghost" (click)="close()">✕</button>
        </div>
        
        <div class="modal-body">
          <p class="text-sm text-muted mb-4" style="margin-bottom: 1.5rem">
            You are attempting a highly sensitive action: <strong>{{ actionDescription }}</strong>.
            <br/><br/>
            Please enter the 6-digit verification code sent to your admin email or authenticator app.
          </p>

          <form [formGroup]="form" (ngSubmit)="verify()" novalidate>
            <div class="form-group">
              <label class="form-label">Verification Code</label>
              <input type="text" class="form-control text-center" style="font-size: 1.5rem; letter-spacing: 0.5rem;"
                     formControlName="otp" maxlength="6" placeholder="000000" autocomplete="off"
                     [class.is-invalid]="f['otp'].invalid && f['otp'].touched" />
              <div class="form-error" *ngIf="f['otp'].invalid && f['otp'].touched">
                Valid 6-digit code is required.
              </div>
            </div>

            <button type="submit" class="btn btn-danger w-full" [disabled]="form.invalid || loading()">
              <ng-container *ngIf="loading()">
                <span class="spinner spinner-dark" style="border-top-color: white"></span> Verifying...
              </ng-container>
              <ng-container *ngIf="!loading()">
                Verify & Proceed
              </ng-container>
            </button>
          </form>
        </div>
      </div>
    </div>
  `
})
export class StepUpOtpModalComponent {
  @Input() isOpen = false;
  @Input() actionContext = 'CRITICAL_ACTION';
  @Input() actionDescription = 'perform a critical system action';
  
  @Output() verified = new EventEmitter<string>(); // Emits step-up token on success
  @Output() canceled = new EventEmitter<void>();

  fb    = inject(FormBuilder);
  auth  = inject(AuthService);
  toast = inject(ToastService);

  loading = signal(false);

  form = this.fb.group({
    otp: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
  });

  get f() { return this.form.controls; }

  verify(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const otpValue = this.form.value.otp!;

    this.auth.verifyStepUpOtp(otpValue, this.actionContext).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.isOpen = false;
        this.form.reset();
        this.verified.emit(res.token);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error('Verification failed', err.error?.message || 'Invalid code. Cannot proceed.');
      }
    });
  }

  close(): void {
    this.isOpen = false;
    this.form.reset();
    this.canceled.emit();
  }
}
