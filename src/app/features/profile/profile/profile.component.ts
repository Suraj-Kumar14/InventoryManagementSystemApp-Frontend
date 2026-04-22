import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { User } from '../../../core/models';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private authSvc = inject(AuthService);
  fb      = inject(FormBuilder);
  http    = inject(HttpClient);
  toast   = inject(ToastService);

  activeTab  = signal<'profile' | 'password'>('profile');
  savingInfo = signal(false);
  savingPw   = signal(false);
  showCurrPw = signal(false);
  showNewPw  = signal(false);

  /** Plain property — safe to use in template without ()  */
  user: User | null = null;

  get initials(): string {
    return this.user ? `${this.user.firstName?.charAt(0) ?? ''}${this.user.lastName?.charAt(0) ?? ''}`.toUpperCase() : '?';
  }

  infoForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName:  ['', [Validators.required, Validators.minLength(2)]],
    email:     [{ value: '', disabled: true }]
  });

  pwForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword:     ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/)]],
    confirmPassword: ['', Validators.required]
  });

  ngOnInit(): void {
    this.user = this.authSvc.currentUser();
    if (this.user) {
      this.infoForm.patchValue({ firstName: this.user.firstName, lastName: this.user.lastName, email: this.user.email });
    }
  }

  toggleCurrPw(): void { this.showCurrPw.update(v => !v); }
  toggleNewPw():  void { this.showNewPw.update(v => !v); }

  saveInfo(): void {
    if (this.infoForm.invalid) { this.infoForm.markAllAsTouched(); return; }
    this.savingInfo.set(true);
    const val = this.infoForm.getRawValue();
    this.http.put(`${environment.apiUrl}/api/v1/auth/me`, val).subscribe({
      next: () => { this.toast.success('Profile updated!'); this.savingInfo.set(false); },
      error: err => { this.toast.error('Update failed', err.error?.message); this.savingInfo.set(false); }
    });
  }

  savePassword(): void {
    const val = this.pwForm.value;
    if (this.pwForm.invalid || val.newPassword !== val.confirmPassword) { this.pwForm.markAllAsTouched(); return; }
    this.savingPw.set(true);
    this.http.post(`${environment.apiUrl}/api/v1/auth/change-password`, {
      currentPassword: val.currentPassword,
      newPassword:     val.newPassword
    }).subscribe({
      next: () => { this.toast.success('Password changed!'); this.pwForm.reset(); this.savingPw.set(false); },
      error: err => { this.toast.error('Change failed', err.error?.message); this.savingPw.set(false); }
    });
  }
}
