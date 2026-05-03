import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { PurchaseOrderHistoryResponse } from '../../../../core/http/backend.models';

@Component({
  selector: 'app-po-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './po-timeline.component.html',
  styleUrls: ['./po-timeline.component.css'],
})
export class PoTimelineComponent {
  @Input() history: PurchaseOrderHistoryResponse[] = [];
}
