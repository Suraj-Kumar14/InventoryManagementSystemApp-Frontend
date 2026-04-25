import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MovementSearchRequest, MovementType } from '../../models';
import { MOVEMENT_TYPES, formatMovementType } from '../../movement.utils';

@Component({
  selector: 'app-movement-filter',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './movement-filter.component.html',
  styleUrls: ['./movement-filter.component.css']
})
export class MovementFilterComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() disabled = false;
  @Input() filters: MovementSearchRequest | null = null;
  @Input() submitLabel = 'Apply Filters';
  @Input() resetLabel = 'Reset';
  @Input() lockedMovementType: MovementType | null = null;

  @Output() filtersChange = new EventEmitter<MovementSearchRequest>();

  readonly movementTypes = MOVEMENT_TYPES;
  readonly form = this.fb.nonNullable.group({
    productId: [''],
    warehouseId: [''],
    movementType: [''],
    referenceId: [''],
    startDate: [''],
    endDate: ['']
  });

  ngOnChanges(changes: SimpleChanges): void {
    if ('filters' in changes) {
      this.patchFromFilters();
    }

    if ('lockedMovementType' in changes && this.lockedMovementType) {
      this.form.controls.movementType.setValue(this.lockedMovementType, { emitEvent: false });
    }
  }

  get hasInvalidDateRange(): boolean {
    const { startDate, endDate } = this.form.getRawValue();

    return Boolean(startDate && endDate && startDate > endDate);
  }

  apply(): void {
    if (this.hasInvalidDateRange) {
      this.form.controls.endDate.markAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    this.filtersChange.emit({
      productId: this.toNullableNumber(value.productId),
      warehouseId: this.toNullableNumber(value.warehouseId),
      movementType: this.lockedMovementType ?? ((value.movementType || '') as MovementType | ''),
      referenceId: value.referenceId.trim(),
      startDate: value.startDate,
      endDate: value.endDate
    });
  }

  reset(): void {
    this.form.reset(
      {
        productId: '',
        warehouseId: '',
        movementType: this.lockedMovementType ?? '',
        referenceId: '',
        startDate: '',
        endDate: ''
      },
      { emitEvent: false }
    );

    this.apply();
  }

  formatType(type: MovementType): string {
    return formatMovementType(type);
  }

  private patchFromFilters(): void {
    if (!this.filters) {
      this.reset();
      return;
    }

    this.form.patchValue(
      {
        productId: this.filters.productId != null ? String(this.filters.productId) : '',
        warehouseId: this.filters.warehouseId != null ? String(this.filters.warehouseId) : '',
        movementType: this.lockedMovementType ?? this.filters.movementType ?? '',
        referenceId: this.filters.referenceId ?? '',
        startDate: this.filters.startDate ?? '',
        endDate: this.filters.endDate ?? ''
      },
      { emitEvent: false }
    );
  }

  private toNullableNumber(value: string): number | null {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
