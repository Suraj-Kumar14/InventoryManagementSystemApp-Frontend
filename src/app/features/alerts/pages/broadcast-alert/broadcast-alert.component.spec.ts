import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AlertApiService } from '../../services/alert-api.service';
import { AlertStateService } from '../../services/alert-state.service';
import { BroadcastAlertComponent } from './broadcast-alert.component';

describe('BroadcastAlertComponent', () => {
  const createBroadcastAlert = jasmine.createSpy().and.returnValue(of([
    {
      alertId: 1,
      alertNumber: 'ALT-20260513-000001',
      recipientRole: 'INVENTORY_MANAGER',
      type: 'SYSTEM_BROADCAST',
      severity: 'INFO',
      status: 'NEW',
      channel: 'IN_APP',
      title: 'Broadcast',
      message: 'Hello team',
      isRead: false,
      isAcknowledged: false,
      isDismissed: false,
    },
  ]));
  const refresh = jasmine.createSpy();
  const success = jasmine.createSpy();
  const warning = jasmine.createSpy();
  const navigate = jasmine.createSpy().and.resolveTo(true);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BroadcastAlertComponent],
      providers: [
        { provide: AlertApiService, useValue: { createBroadcastAlert } },
        { provide: AlertStateService, useValue: { refresh } },
        { provide: NotificationService, useValue: { success, warning } },
        { provide: AuthService, useValue: { getUserRole: () => 'MANAGER' } },
        { provide: Router, useValue: { navigate } },
      ],
    }).compileComponents();
  });

  it('should send canonical broadcast role names and refresh current user state when included', () => {
    const fixture = TestBed.createComponent(BroadcastAlertComponent);
    const component = fixture.componentInstance;

    component.form.setValue({
      recipientRoles: ['INVENTORY_MANAGER', 'WAREHOUSE_STAFF'],
      severity: 'INFO',
      title: 'Broadcast',
      message: 'Hello team',
      actionUrl: '',
    });

    component.submit();

    expect(createBroadcastAlert).toHaveBeenCalledWith(jasmine.objectContaining({
      recipientRoles: ['INVENTORY_MANAGER', 'WAREHOUSE_STAFF'],
    }));
    expect(refresh).toHaveBeenCalled();
    expect(success).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/alerts']);
  });
});
