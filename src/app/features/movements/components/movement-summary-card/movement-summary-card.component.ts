import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type MovementSummaryTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-movement-summary-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './movement-summary-card.component.html',
  styleUrls: ['./movement-summary-card.component.css']
})
export class MovementSummaryCardComponent {
  @Input() title = '';
  @Input() value: string | number = '--';
  @Input() subtitle = '';
  @Input() caption = '';
  @Input() icon = 'MV';
  @Input() tone: MovementSummaryTone = 'neutral';
}
