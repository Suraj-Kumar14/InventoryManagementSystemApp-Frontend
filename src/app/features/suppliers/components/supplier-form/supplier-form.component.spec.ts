import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SupplierFormComponent } from './supplier-form.component';

describe('SupplierFormComponent', () => {
  let fixture: ComponentFixture<SupplierFormComponent>;
  let component: SupplierFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplierFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SupplierFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should validate required name', () => {
    component.form.patchValue({ name: '' });
    component.submit();

    expect(component.form.controls.name.invalid).toBe(true);
  });

  it('should validate email format', () => {
    component.form.patchValue({ name: 'Acme', email: 'bad-email', paymentTerms: 'NET-30', leadTimeDays: 3, rating: 4 });
    component.submit();

    expect(component.form.controls.email.invalid).toBe(true);
  });

  it('should validate rating range', () => {
    component.form.patchValue({ name: 'Acme', paymentTerms: 'NET-30', leadTimeDays: 3, rating: 8 });
    component.submit();

    expect(component.form.controls.rating.invalid).toBe(true);
  });

  it('should validate leadTimeDays', () => {
    component.form.patchValue({ name: 'Acme', paymentTerms: 'NET-30', leadTimeDays: -1, rating: 4 });
    component.submit();

    expect(component.form.controls.leadTimeDays.invalid).toBe(true);
  });

  it('should disable save when invalid', () => {
    component.form.patchValue({ name: '', paymentTerms: 'NET-30', leadTimeDays: 0, rating: 0 });
    fixture.detectChanges();

    const submitButton: HTMLButtonElement = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
    expect(submitButton.disabled).toBe(true);
  });

  it('should show loading state', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const submitButton: HTMLButtonElement = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
    expect(submitButton.textContent?.trim()).toContain('Saving...');
    expect(submitButton.disabled).toBe(true);
  });
});
