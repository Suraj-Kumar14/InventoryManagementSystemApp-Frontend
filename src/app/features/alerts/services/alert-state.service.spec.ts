import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { AlertApiService } from './alert-api.service';
import { AlertStateService } from './alert-state.service';

describe('AlertStateService', () => {
  let service: AlertStateService;
  const alertApi = {
    getUnreadCount: vi.fn(),
    getMyAlerts: vi.fn(),
  };
  const notifications = {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        AlertStateService,
        { provide: AlertApiService, useValue: alertApi },
        { provide: NotificationService, useValue: notifications },
      ],
    });

    service = TestBed.inject(AlertStateService);
  });

  it('uses sanitized userMessage when publishing notifications', () => {
    alertApi.getUnreadCount.mockReturnValue(of(0));
    alertApi.getMyAlerts.mockReturnValueOnce(
      of({
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
        size: 5,
        numberOfElements: 0,
        first: true,
        last: true,
        empty: true,
      })
    );
    service.refresh();

    const longUserMessage = 'Movement reversal failed due to invalid movement type configuration. '.repeat(4);
    alertApi.getMyAlerts.mockReturnValueOnce(
      of({
        content: [
          {
            alertId: 100,
            alertNumber: 'ALT-100',
            type: 'SYSTEM_ERROR',
            severity: 'CRITICAL',
            status: 'NEW',
            channel: 'IN_APP',
            title: 'System Error Alert',
            message: 'technical JDBC text',
            userMessage: longUserMessage,
            isRead: false,
            isAcknowledged: false,
            isDismissed: false,
            createdAt: '2026-05-13T00:00:00',
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
      })
    );

    service.refresh();

    expect(notifications.error).toHaveBeenCalledTimes(1);
    const [message, title] = notifications.error.mock.calls[0];
    expect(title).toBe('System Error Alert');
    expect(message).toContain('Movement reversal failed due to invalid movement type configuration.');
    expect(String(message)).not.toContain('technical JDBC text');
    expect(String(message).length).toBeLessThanOrEqual(140);
  });
});
