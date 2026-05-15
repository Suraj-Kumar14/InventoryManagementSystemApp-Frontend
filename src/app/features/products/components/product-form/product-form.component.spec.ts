import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ProductFormComponent } from './product-form.component';

describe('ProductFormComponent', () => {
  let fixture: ComponentFixture<ProductFormComponent>;
  let component: ProductFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should validate required fields', () => {
    component.form.setValue({
      sku: '',
      name: '',
      description: '',
      category: '',
      brand: '',
      unitOfMeasure: '',
      costPrice: null,
      sellingPrice: null,
      reorderLevel: null,
      maxStockLevel: null,
      leadTimeDays: null,
      imageUrl: '',
      barcode: '',
      isActive: true,
    });

    component.submit();
    fixture.detectChanges();

    expect(component.form.invalid).toBe(true);
    expect(component.form.controls.name.hasError('required')).toBe(true);
    expect(component.form.controls.category.hasError('required')).toBe(true);
    expect(component.form.controls.unitOfMeasure.hasError('required')).toBe(true);
  });

  it('should disable save when invalid', () => {
    component.form.patchValue({
      sku: '',
      name: '',
    });
    fixture.detectChanges();

    const submitButton: HTMLButtonElement = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;

    expect(component.form.invalid).toBe(true);
    expect(submitButton.disabled).toBe(true);
  });

  it('should show loading state', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const submitButton: HTMLButtonElement = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;

    expect(submitButton.textContent?.trim()).toBe('Saving...');
    expect(submitButton.disabled).toBe(true);
  });
});
