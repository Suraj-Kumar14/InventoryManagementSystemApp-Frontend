import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-date-range-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="date-range-filter">
      <div class="date-field">
        <label class="form-label">{{ fromLabel }}</label>
        <input
          class="form-control"
          type="date"
          [disabled]="disabled"
          [ngModel]="localFromDate"
          (ngModelChange)="onFromDateChange($event)"
        />
      </div>

      <div class="date-field">
        <label class="form-label">{{ toLabel }}</label>
        <input
          class="form-control"
          type="date"
          [disabled]="disabled"
          [ngModel]="localToDate"
          (ngModelChange)="onToDateChange($event)"
        />
      </div>
    </div>

    @if (showValidation && isInvalid) {
      <div class="form-error">From date cannot be later than to date.</div>
    }

    @if (hint) {
      <div class="form-hint">{{ hint }}</div>
    }
  `,
  styles: [
    `
      .date-range-filter {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 1rem;
      }

      .date-field {
        min-width: 0;
      }
    `
  ]
})
export class DateRangeFilterComponent implements OnChanges {
  @Input() fromDate = '';
  @Input() toDate = '';
  @Input() fromLabel = 'From';
  @Input() toLabel = 'To';
  @Input() disabled = false;
  @Input() showValidation = true;
  @Input() hint = '';

  @Output() rangeChange = new EventEmitter<{ fromDate: string; toDate: string }>();
  @Output() validityChange = new EventEmitter<boolean>();

  localFromDate = '';
  localToDate = '';

  ngOnChanges(): void {
    this.localFromDate = this.fromDate ?? '';
    this.localToDate = this.toDate ?? '';
    this.emitValidity();
  }

  get isInvalid(): boolean {
    return Boolean(this.localFromDate && this.localToDate && this.localFromDate > this.localToDate);
  }

  onFromDateChange(value: string): void {
    this.localFromDate = value;
    this.emitChanges();
  }

  onToDateChange(value: string): void {
    this.localToDate = value;
    this.emitChanges();
  }

  private emitChanges(): void {
    this.rangeChange.emit({
      fromDate: this.localFromDate,
      toDate: this.localToDate
    });
    this.emitValidity();
  }

  private emitValidity(): void {
    this.validityChange.emit(!this.isInvalid);
  }
}
