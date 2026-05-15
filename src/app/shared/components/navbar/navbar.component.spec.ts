import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../core/auth/services/auth.service';
import { AlertBellComponent } from '../../../features/alerts/components/alert-bell/alert-bell.component';
import { NavbarComponent } from './navbar.component';

@Component({ selector: 'app-alert-bell', standalone: true, template: '<div class="alert-bell-stub"></div>' })
class AlertBellStubComponent {}

describe('NavbarComponent', () => {
  let fixture: ComponentFixture<NavbarComponent>;
  let component: NavbarComponent;

  const authService = {
    currentUser$: of({
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'ADMIN',
    }),
    getFirstName: vi.fn((name?: string | null) => name?.split(' ')[0] ?? 'User'),
    logout: vi.fn(() => of(void 0)),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    })
      .overrideComponent(NavbarComponent, {
        remove: { imports: [AlertBellComponent] },
        add: { imports: [AlertBellStubComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function getAvatarButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.navbar-avatar-btn') as HTMLButtonElement;
  }

  function getDropdown(): HTMLElement | null {
    return fixture.nativeElement.querySelector('.navbar-dropdown');
  }

  it('opens the dropdown when the avatar button is clicked', () => {
    getAvatarButton().click();
    fixture.detectChanges();

    expect(component.showUserMenu).toBe(true);
    expect(getDropdown()).not.toBeNull();
  });

  it('closes the dropdown when clicking outside the profile menu', () => {
    getAvatarButton().click();
    fixture.detectChanges();

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(component.showUserMenu).toBe(false);
    expect(getDropdown()).toBeNull();
  });

  it('keeps the dropdown open when clicking inside the dropdown', () => {
    getAvatarButton().click();
    fixture.detectChanges();

    const dropdown = getDropdown();
    expect(dropdown).not.toBeNull();

    dropdown?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(component.showUserMenu).toBe(true);
    expect(getDropdown()).not.toBeNull();
  });
});
