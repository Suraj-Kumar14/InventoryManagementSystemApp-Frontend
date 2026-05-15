import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { NotificationService } from '../../../../core/services/notification.service';
import { AlertCenterComponent } from './alert-center.component';
import { AlertApiService } from '../../services/alert-api.service';
import { AlertStateService } from '../../services/alert-state.service';

describe('AlertCenterComponent', () => {
  const alertApi = {
    searchAlerts: jasmine.createSpy().and.returnValue(of({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 10,
      numberOfElements: 0,
      first: true,
      last: true,
      empty: true,
    })),
    getMyAlertSummary: jasmine.createSpy().and.returnValue(of({
      totalAlerts: 1,
      unreadCount: 1,
      acknowledgedCount: 0,
      dismissedCount: 0,
      criticalCount: 0,
      warningCount: 1,
      infoCount: 0,
      lowStockCount: 0,
      overstockCount: 0,
      pendingPoApprovalCount: 0,
      overduePoCount: 0,
    })),
    markAllAsRead: jasmine.createSpy().and.returnValue(of(void 0)),
    markAsRead: jasmine.createSpy(),
    acknowledgeAlert: jasmine.createSpy(),
    dismissAlert: jasmine.createSpy(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertCenterComponent],
      providers: [
        provideRouter([]),
        { provide: AlertApiService, useValue: alertApi },
        { provide: AlertStateService, useValue: { startPolling: jasmine.createSpy(), refresh: jasmine.createSpy() } },
        { provide: NotificationService, useValue: { success: jasmine.createSpy() } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({}),
            },
          },
        },
      ],
    }).compileComponents();
  });

  it('should start with a default summary and load without NG0100', fakeAsync(() => {
    const fixture = TestBed.createComponent(AlertCenterComponent);
    const component = fixture.componentInstance;

    expect(component.summary.totalAlerts).toBe(0);
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();

    expect(component.summary.totalAlerts).toBe(1);
    expect(alertApi.getMyAlertSummary).toHaveBeenCalled();
    expect(alertApi.searchAlerts).toHaveBeenCalled();
  }));
});
