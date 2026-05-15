import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PoFormComponent } from './po-form.component';

describe('PoFormComponent', () => {
  let fixture: ComponentFixture<PoFormComponent>;
  let component: PoFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PoFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PoFormComponent);
    component = fixture.componentInstance;
    component.suppliers = [{ supplierId: 1, name: 'Acme', email: 'a@b.com', city: 'Pune', country: 'India', leadTimeDays: 5, isActive: true }];
    component.warehouses = [{ warehouseId: 2, name: 'Main', code: 'WH-1', location: 'Pune', capacity: 1000, isActive: true }];
    component.products = [{ productId: 3, sku: 'SKU-1', name: 'Widget', category: 'Tools', unitOfMeasure: 'Piece', costPrice: 100, sellingPrice: 150, reorderLevel: 5, maxStockLevel: 20, leadTimeDays: 4, isActive: true }];
    if (component.lineItems.length === 0) {
      component.addLineItem();
    }
    fixture.detectChanges();
  });

  it('should validate required supplier', () => {
    component.form.patchValue({
      supplierId: 0,
      warehouseId: 2,
      expectedDeliveryDate: '',
    });

    component.submit();

    expect(component.form.invalid).toBe(true);
    expect(component.form.controls.supplierId.hasError('min')).toBe(true);
  });

  it('should validate required warehouse', () => {
    component.form.patchValue({
      supplierId: 1,
      warehouseId: 0,
      expectedDeliveryDate: '2026-05-05',
    });

    component.submit();

    expect(component.form.controls.warehouseId.hasError('min')).toBe(true);
  });

  it('should validate at least one line item', () => {
    while (component.lineItems.length > 0) {
      component.lineItems.removeAt(0);
    }

    component.submit();

    expect(component.lineItems.length).toBe(0);
    expect(component.form.invalid).toBe(true);
  });

  it('should calculate line totals and grand total', () => {
    const lineItem = component.lineItems.at(0);
    lineItem.patchValue({ productId: 3, orderedQuantity: 4, unitCost: 250 });
    component.form.patchValue({ supplierId: 1, warehouseId: 2, expectedDeliveryDate: '2026-05-05', taxAmount: 20, shippingAmount: 30, discountAmount: 10 });

    expect(component.getLineTotal(0)).toBe(1000);
    expect(component.grandTotal).toBe(1040);
  });

  it('should disable save when invalid', () => {
    component.form.patchValue({ supplierId: 0, warehouseId: 0, expectedDeliveryDate: '' });
    fixture.detectChanges();

    const submitButton: HTMLButtonElement = fixture.debugElement.query(By.css('.btn.btn-primary')).nativeElement;
    expect(submitButton.disabled).toBe(true);
  });

  it('should show loading state', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const submitButton: HTMLButtonElement = fixture.debugElement.query(By.css('.btn.btn-primary')).nativeElement;
    expect(submitButton.textContent?.trim()).toContain('Save Draft...');
    expect(submitButton.disabled).toBe(true);
  });

  it('should show submitting state on the submit button', () => {
    fixture.componentRef.setInput('submitting', true);
    fixture.detectChanges();

    const submitAndApproveButton: HTMLButtonElement = fixture.debugElement.query(By.css('.btn.btn-accent')).nativeElement;
    expect(submitAndApproveButton.textContent?.trim()).toContain('Submitting...');
    expect(submitAndApproveButton.disabled).toBe(true);
  });
});
