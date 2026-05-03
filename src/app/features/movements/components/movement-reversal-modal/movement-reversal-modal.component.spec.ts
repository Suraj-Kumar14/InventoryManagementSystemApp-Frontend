import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MovementReversalModalComponent } from './movement-reversal-modal.component';

describe('MovementReversalModalComponent', () => {
  let fixture: ComponentFixture<MovementReversalModalComponent>;
  let component: MovementReversalModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovementReversalModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MovementReversalModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
  });

  it('should require reason', () => {
    component.submit();
    expect(component.form.controls.reasonCode.invalid).toBe(true);
  });

  it('should show loading state', () => {
    fixture.componentRef.setInput('saving', true);
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
    expect(button.textContent?.trim()).toContain('Reversing...');
    expect(button.disabled).toBe(true);
  });

  it('should submit valid reversal request', () => {
    const emitSpy = vi.spyOn(component.confirm, 'emit');
    component.form.patchValue({ reasonCode: 'MANUAL_CORRECTION', notes: 'Fixing a double receipt' });
    component.submit();

    expect(emitSpy).toHaveBeenCalledWith({ reasonCode: 'MANUAL_CORRECTION', notes: 'Fixing a double receipt' });
  });
});
