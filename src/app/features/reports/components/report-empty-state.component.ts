import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-report-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="empty-state">
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
    </section>
  `,
  styles: [
    `
      .empty-state {
        padding: 2rem;
        border-radius: 24px;
        text-align: center;
        background: linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%);
        border: 1px dashed #bfdbfe;
        color: #1e293b;
      }
      h3 {
        margin: 0 0 0.4rem;
        font-size: 1.1rem;
      }
      p {
        margin: 0;
        color: #64748b;
      }
    `,
  ],
})
export class ReportEmptyStateComponent {
  @Input() title = 'No report data found';
  @Input() message = 'No report data found for the selected filters.';
}
