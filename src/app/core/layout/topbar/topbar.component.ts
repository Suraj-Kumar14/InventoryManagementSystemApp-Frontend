import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent implements OnInit {
  auth         = inject(AuthService);
  alertSvc     = inject(AlertService);

  unreadCount  = signal(0);
  profileOpen  = signal(false);
  notifOpen    = signal(false);

  ngOnInit(): void {
    this.loadUnreadCount();
  }

  loadUnreadCount(): void {
    this.alertSvc.getUnreadCount().subscribe({
      next: res => this.unreadCount.set(res.unreadCount),
      error: () => {}
    });
  }

  toggleProfile(): void {
    this.profileOpen.update(v => !v);
    this.notifOpen.set(false);
  }

  toggleNotif(): void {
    this.notifOpen.update(v => !v);
    this.profileOpen.set(false);
  }

  closeDropdowns(): void {
    this.profileOpen.set(false);
    this.notifOpen.set(false);
  }

  logout(): void { this.auth.logout(); }

  get initials(): string {
    const u = this.auth.currentUser();
    if (!u) return '?';
    return `${u.firstName?.charAt(0) ?? ''}${u.lastName?.charAt(0) ?? ''}`.toUpperCase();
  }

  get fullName(): string {
    const u = this.auth.currentUser();
    return u ? `${u.firstName} ${u.lastName}` : '';
  }
}
