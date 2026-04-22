import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReportService } from '../../core/services/report.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardKpi } from '../../core/models';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, SkeletonComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  reportSvc = inject(ReportService);
  auth      = inject(AuthService);

  kpi     = signal<DashboardKpi | null>(null);
  loading = signal(true);
  error   = signal(false);

  ngOnInit(): void { this.loadKpis(); }

  loadKpis(): void {
    this.loading.set(true);
    this.error.set(false);
    this.reportSvc.getDashboardKpis().subscribe({
      next: data => { this.kpi.set(data); this.loading.set(false); },
      error: ()   => { this.error.set(true); this.loading.set(false); }
    });
  }

  formatCurrency(val: number | undefined): string {
    if (val == null) return '—';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  }

  formatNumber(val: number | undefined): string {
    if (val == null) return '—';
    return new Intl.NumberFormat('en-IN').format(val);
  }
}
