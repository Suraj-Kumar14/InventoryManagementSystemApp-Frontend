import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from '../../../shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent],
  template: `
    <div class="auth-wrapper">
      <div class="auth-left">
        <div class="auth-brand">
          <span class="brand-icon">📦</span>
          <span class="brand-name">StockPro</span>
        </div>
        <div class="auth-hero">
          <h1>Enterprise Inventory<br>Management</h1>
          <p>Control your stock, streamline operations, and make data-driven decisions — all in one platform.</p>
        </div>
        <div class="auth-features">
          <div class="feature-item"><span>📊</span> Real-time analytics dashboard</div>
          <div class="feature-item"><span>🔔</span> Smart low-stock alerts</div>
          <div class="feature-item"><span>🏭</span> Multi-warehouse management</div>
          <div class="feature-item"><span>📋</span> Purchase order workflows</div>
        </div>
        <div class="auth-tagline">Trusted by 500+ enterprises worldwide</div>
      </div>
      <div class="auth-right">
        <router-outlet />
      </div>
    </div>
    <app-toast-container />
  `,
  styles: [`
    .auth-wrapper {
      display: flex;
      min-height: 100vh;
    }
    .auth-left {
      flex: 1;
      background: linear-gradient(145deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 3rem 4rem;
      position: relative;
      overflow: hidden;
    }
    .auth-left::before {
      content: '';
      position: absolute;
      top: -30%;
      right: -20%;
      width: 500px; height: 500px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(79,110,247,.25), transparent 60%);
    }
    .auth-left::after {
      content: '';
      position: absolute;
      bottom: -20%;
      left: -10%;
      width: 400px; height: 400px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(124,58,237,.2), transparent 60%);
    }
    .auth-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 3rem;
      position: relative;
    }
    .brand-icon { font-size: 2rem; }
    .brand-name {
      font-size: 1.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, #fff, #a5b4fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -0.04em;
    }
    .auth-hero { margin-bottom: 2.5rem; position: relative; }
    .auth-hero h1 {
      font-size: 2.75rem;
      font-weight: 800;
      color: #fff;
      line-height: 1.15;
      margin-bottom: 1rem;
      letter-spacing: -0.035em;
    }
    .auth-hero p { color: rgba(255,255,255,.6); font-size: 1.0625rem; line-height: 1.65; max-width: 420px; }
    .auth-features { display: flex; flex-direction: column; gap: 0.875rem; margin-bottom: 2.5rem; position: relative; }
    .feature-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: rgba(255,255,255,.75);
      font-size: 0.9375rem;
      font-weight: 500;
    }
    .feature-item span { font-size: 1.25rem; }
    .auth-tagline { font-size: 0.8125rem; color: rgba(255,255,255,.35); position: relative; }
    .auth-right {
      width: 480px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: var(--surface-bg);
    }
    @media (max-width: 900px) {
      .auth-left { display: none; }
      .auth-right { width: 100%; }
    }
  `]
})
export class AuthLayoutComponent {}
