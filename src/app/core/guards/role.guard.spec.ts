import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { AuthService } from '../auth/services/auth.service';
import { UserRole } from '../../shared/config/app-config';
import { roleGuard } from './role.guard';

getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

describe('roleGuard', () => {
  const routerStub = {
    navigate: vi.fn(),
  };

  const authServiceStub = {
    isAuthenticated: vi.fn(),
    hasRole: vi.fn(),
    getUserRole: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerStub },
        { provide: AuthService, useValue: authServiceStub },
      ],
    });
  });

  function runGuard(data: Record<string, unknown>) {
    const route = { data } as unknown as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;
    return TestBed.runInInjectionContext(() => roleGuard(route, state));
  }

  it('ADMIN can access supplier create and edit routes', () => {
    authServiceStub.isAuthenticated.mockReturnValue(true);
    authServiceStub.hasRole.mockReturnValue(true);
    authServiceStub.getUserRole.mockReturnValue(UserRole.ADMIN);

    expect(runGuard({ roles: [UserRole.ADMIN, UserRole.OFFICER] })).toBe(true);
  });

  it('PURCHASE_OFFICER can access supplier create and edit routes', () => {
    authServiceStub.isAuthenticated.mockReturnValue(true);
    authServiceStub.hasRole.mockReturnValue(true);
    authServiceStub.getUserRole.mockReturnValue(UserRole.OFFICER);

    expect(runGuard({ roles: [UserRole.ADMIN, UserRole.OFFICER] })).toBe(true);
  });

  it('WAREHOUSE_STAFF cannot access supplier create and edit routes', () => {
    authServiceStub.isAuthenticated.mockReturnValue(true);
    authServiceStub.hasRole.mockReturnValue(false);
    authServiceStub.getUserRole.mockReturnValue(UserRole.STAFF);

    expect(runGuard({ roles: [UserRole.ADMIN, UserRole.OFFICER] })).toBe(false);
    expect(routerStub.navigate).toHaveBeenCalledWith(['/403']);
  });

  it('ADMIN can access manager dashboard routes because admin override is enabled', () => {
    authServiceStub.isAuthenticated.mockReturnValue(true);
    authServiceStub.hasRole.mockReturnValue(true);
    authServiceStub.getUserRole.mockReturnValue(UserRole.ADMIN);

    expect(runGuard({ roles: [UserRole.MANAGER] })).toBe(true);
  });

  it('WAREHOUSE_STAFF can access warehouse dashboard route', () => {
    authServiceStub.isAuthenticated.mockReturnValue(true);
    authServiceStub.hasRole.mockReturnValue(true);
    authServiceStub.getUserRole.mockReturnValue(UserRole.STAFF);

    expect(
      runGuard({ roles: [UserRole.STAFF], allowAdminOverride: false, redirectUnauthorizedToRoleHome: true })
    ).toBe(true);
  });

  it('ADMIN is redirected to admin dashboard when warehouse dashboard disables admin override', () => {
    authServiceStub.isAuthenticated.mockReturnValue(true);
    authServiceStub.hasRole.mockReturnValue(true);
    authServiceStub.getUserRole.mockReturnValue(UserRole.ADMIN);

    expect(
      runGuard({ roles: [UserRole.STAFF], allowAdminOverride: false, redirectUnauthorizedToRoleHome: true })
    ).toBe(false);
    expect(routerStub.navigate).toHaveBeenCalledWith(['/dashboard/admin']);
  });

  it('INVENTORY_MANAGER is redirected to manager dashboard when warehouse dashboard is staff-only', () => {
    authServiceStub.isAuthenticated.mockReturnValue(true);
    authServiceStub.hasRole.mockReturnValue(false);
    authServiceStub.getUserRole.mockReturnValue(UserRole.MANAGER);

    expect(
      runGuard({ roles: [UserRole.STAFF], allowAdminOverride: false, redirectUnauthorizedToRoleHome: true })
    ).toBe(false);
    expect(routerStub.navigate).toHaveBeenCalledWith(['/dashboard/manager']);
  });

  it('PURCHASE_OFFICER cannot access admin dashboard routes', () => {
    authServiceStub.isAuthenticated.mockReturnValue(true);
    authServiceStub.hasRole.mockReturnValue(false);
    authServiceStub.getUserRole.mockReturnValue(UserRole.OFFICER);

    expect(runGuard({ roles: [UserRole.ADMIN] })).toBe(false);
    expect(routerStub.navigate).toHaveBeenCalledWith(['/403']);
  });

  it('unauthenticated user is redirected to login', () => {
    authServiceStub.isAuthenticated.mockReturnValue(false);
    authServiceStub.getUserRole.mockReturnValue(null);

    expect(runGuard({ roles: [UserRole.STAFF] })).toBe(false);
    expect(routerStub.navigate).toHaveBeenCalledWith(['/login']);
  });
});
