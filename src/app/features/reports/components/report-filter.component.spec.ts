import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportFilterComponent } from './report-filter.component';

describe('ReportFilterComponent', () => {
  let component: ReportFilterComponent;
  let fixture: ComponentFixture<ReportFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportFilterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should emit filters on apply', () => {
    const emitted: unknown[] = [];
    component.filtersChange.subscribe((value) => emitted.push(value));

    component.form.patchValue({ warehouseId: 5, productId: 7 });
    component.apply();

    expect(emitted.length).toBe(1);
    expect(emitted[0]).toEqual({
      period: 'LAST_30_DAYS',
      fromDate: undefined,
      toDate: undefined,
      warehouseId: 5,
      productId: 7,
      supplierId: undefined,
      page: 0,
      size: 20,
    });
  });

  it('should reset filters', () => {
    component.form.patchValue({ warehouseId: 5, productId: 7, period: 'CUSTOM' });
    component.reset();

    expect(component.form.getRawValue().warehouseId).toBeNull();
    expect(component.form.getRawValue().period).toBe('LAST_30_DAYS');
  });
});
