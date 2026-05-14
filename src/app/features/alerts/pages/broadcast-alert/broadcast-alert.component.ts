import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { AlertResponse, CreateBroadcastAlertRequest } from '../../../../core/http/backend.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { AlertApiService } from '../../services/alert-api.service';
import { AlertStateService } from '../../services/alert-state.service';

type BroadcastRole = 'ALL' | 'ADMIN' | 'INVENTORY_MANAGER' | 'PURCHASE_OFFICER' | 'WAREHOUSE_STAFF';

interface BroadcastRoleOption {
  value: BroadcastRole;
  label: string;
}

const BROADCAST_ROLE_OPTIONS: BroadcastRoleOption[] = [
  { value: 'ALL', label: 'All Roles' },
  { value: 'ADMIN', label: 'Administrator' },
  { value: 'INVENTORY_MANAGER', label: 'Inventory Manager' },
  { value: 'PURCHASE_OFFICER', label: 'Purchase Officer' },
  { value: 'WAREHOUSE_STAFF', label: 'Warehouse Staff' },
];

@Component({
  selector: 'app-broadcast-alert',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="broadcast-shell">
      <header>
        <p class="eyebrow">Broadcast Alert</p>
        <h1>Send a platform-wide alert</h1>
      </header>
      <form class="broadcast-form" [formGroup]="form" (ngSubmit)="submit()">
        <label>
          Recipient Roles
          <select formControlName="recipientRoles" multiple>
            <option *ngFor="let role of roles" [value]="role.value">{{ role.label }}</option>
          </select>
        </label>
        <label>
          Severity
          <select formControlName="severity">
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </label>
        <label>
          Title
          <input formControlName="title" placeholder="Alert title" />
        </label>
        <label>
          Message
          <textarea rows="5" formControlName="message" placeholder="What do recipients need to know?"></textarea>
        </label>
        <label>
          Action URL
          <input formControlName="actionUrl" placeholder="/purchase-orders/approvals" />
        </label>
        <div class="broadcast-actions">
          <button type="button" class="btn-secondary" (click)="router.navigate(['/alerts'])">Cancel</button>
          <button type="submit" class="btn-primary" [disabled]="form.invalid || saving">{{ saving ? 'Sending...' : 'Send Broadcast' }}</button>
        </div>
      </form>
    </section>
  `,
  styles: [`
    .broadcast-shell { display:grid; gap:1rem; }
    .eyebrow { text-transform:uppercase; letter-spacing:0.16em; font-size:0.72rem; color:#2563eb; }
    .broadcast-form { display:grid; gap:1rem; padding:1.3rem; border:1px solid #dbe4f0; border-radius:24px; background:#fff; }
    label { display:grid; gap:0.45rem; color:#334155; font-weight:600; }
    input, select, textarea { border:1px solid #cbd5e1; border-radius:14px; padding:0.85rem 0.95rem; font:inherit; }
    select[multiple] { min-height:140px; }
    .broadcast-actions { display:flex; justify-content:flex-end; gap:0.75rem; }
    .btn-primary,.btn-secondary { border:none; border-radius:14px; padding:0.8rem 1rem; cursor:pointer; font-weight:600; }
    .btn-primary { background:#2563eb; color:#fff; }
    .btn-secondary { background:#e2e8f0; color:#0f172a; }
  `],
})
export class BroadcastAlertComponent {
  readonly roles = BROADCAST_ROLE_OPTIONS;
  private readonly fb = inject(FormBuilder);
  private readonly alertApi = inject(AlertApiService);
  private readonly notification = inject(NotificationService);
  private readonly authService = inject(AuthService);
  private readonly alertState = inject(AlertStateService);
  readonly router = inject(Router);

  saving = false;
  readonly form = this.fb.nonNullable.group({
    recipientRoles: [['INVENTORY_MANAGER' as BroadcastRole], Validators.required],
    severity: ['INFO', Validators.required],
    title: ['', Validators.required],
    message: ['', Validators.required],
    actionUrl: [''],
  });

  submit(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const recipientRoles = this.normalizeRecipientRoles(raw.recipientRoles);
    const payload: CreateBroadcastAlertRequest = {
      recipientRoles,
      severity: raw.severity as CreateBroadcastAlertRequest['severity'],
      title: raw.title,
      message: raw.message,
      actionUrl: raw.actionUrl || null,
    };
    this.saving = true;
    this.alertApi.createBroadcastAlert(payload).pipe(finalize(() => (this.saving = false))).subscribe({
      next: (createdAlerts) => {
        if (!createdAlerts.length) {
          this.notification.warning('Broadcast request completed, but no alerts were created.');
          return;
        }

        if (this.shouldRefreshCurrentUser(recipientRoles, createdAlerts)) {
          this.alertState.refresh();
        }
        this.notification.success('Broadcast alert sent successfully');
        this.router.navigate(['/alerts']);
      },
    });
  }

  private normalizeRecipientRoles(roles: readonly BroadcastRole[]): BroadcastRole[] {
    const uniqueRoles = new Set<BroadcastRole>();
    for (const role of roles) {
      uniqueRoles.add(role);
    }
    return [...uniqueRoles];
  }

  private shouldRefreshCurrentUser(roles: readonly BroadcastRole[], createdAlerts: readonly AlertResponse[]): boolean {
    const currentRole = this.authService.getUserRole();
    if (!currentRole) {
      return false;
    }

    if (roles.includes('ALL')) {
      return createdAlerts.length > 0;
    }

    return roles.includes(this.toAlertRole(currentRole));
  }

  private toAlertRole(role: string): BroadcastRole {
    switch (role) {
      case 'ADMIN':
        return 'ADMIN';
      case 'MANAGER':
      case 'INVENTORY_MANAGER':
        return 'INVENTORY_MANAGER';
      case 'OFFICER':
      case 'PURCHASE_OFFICER':
        return 'PURCHASE_OFFICER';
      default:
        return 'WAREHOUSE_STAFF';
    }
  }
}
