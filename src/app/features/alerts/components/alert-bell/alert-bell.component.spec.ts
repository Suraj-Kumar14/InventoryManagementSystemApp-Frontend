import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { NotificationService } from '../../../../core/services/notification.service';
import { AlertApiService } from '../../services/alert-api.service';
import { AlertBellComponent } from './alert-bell.component';

@Component({ standalone: true, template: '' })
class DummyComponent {}

describe('AlertBellComponent', () => {
  let fixture: ComponentFixture<AlertBellComponent>;
  let component: AlertBellComponent;
  const alertApi = {
    getUnreadCount: vi.fn(),
    getMyAlerts: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  };
  const notification = {
    success: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    alertApi.getUnreadCount.mockReturnValue(of(3));
    alertApi.getMyAlerts.mockReturnValue(of({
      content: [
        {
          alertId: 10,
          alertNumber: 'ALT-20260501-000010',
          type: 'LOW_STOCK',
          severity: 'WARNING',
          status: 'NEW',
          channel: 'IN_APP',
          title: 'Low stock',
          message: 'Restock item',
          isRead: false,
          isAcknowledged: false,
          isDismissed: false,
          createdAt: '2026-05-01T10:00:00',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 5,
      numberOfElements: 1,
      first: true,
      last: true,
      empty: false,
    }));
    alertApi.markAsRead.mockReturnValue(of({
      alertId: 10,
      alertNumber: 'ALT-20260501-000010',
      type: 'LOW_STOCK',
      severity: 'WARNING',
      status: 'READ',
      channel: 'IN_APP',
      title: 'Low stock',
      message: 'Restock item',
      isRead: true,
      isAcknowledged: false,
      isDismissed: false,
      createdAt: '2026-05-01T10:00:00',
    }));
    alertApi.markAllAsRead.mockReturnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [AlertBellComponent],
      providers: [
        provideRouter([{ path: 'alerts/:id', component: DummyComponent }]),
        { provide: AlertApiService, useValue: alertApi },
        { provide: NotificationService, useValue: notification },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AlertBellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    vi.runOnlyPendingTimers();
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should show unread count', () => {
    expect(component.unreadCount).toBe(3);
  });

  it('should load recent alerts', () => {
    expect(component.recentAlerts.length).toBe(1);
    expect(component.recentAlerts[0].title).toBe('Low stock');
  });

  it('should mark alert as read on click', () => {
    component.openAlert(component.recentAlerts[0]);
    expect(alertApi.markAsRead).toHaveBeenCalledWith(10);
  });

  it('should mark all alerts as read', () => {
    component.markAllRead();
    expect(alertApi.markAllAsRead).toHaveBeenCalled();
  });
});
