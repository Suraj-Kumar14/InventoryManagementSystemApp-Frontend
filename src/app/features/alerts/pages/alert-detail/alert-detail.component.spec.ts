import { convertToParamMap, ActivatedRoute, provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AlertApiService } from '../../services/alert-api.service';
import { AlertDetailComponent } from './alert-detail.component';

describe('AlertDetailComponent', () => {
  let fixture: ComponentFixture<AlertDetailComponent>;
  const alertApi = {
    getAlertById: vi.fn(),
    markAsRead: vi.fn(),
    acknowledgeAlert: vi.fn(),
    dismissAlert: vi.fn(),
    resolveAlert: vi.fn(),
  };
  const authService = {
    getUserRole: vi.fn(() => 'ADMIN'),
  };
  const notification = {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  };

  async function flushAlertDetailUi() {
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  }

  async function createComponent() {
    await TestBed.configureTestingModule({
      imports: [AlertDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: '10' })),
          },
        },
        { provide: AlertApiService, useValue: alertApi },
        { provide: AuthService, useValue: authService },
        { provide: NotificationService, useValue: notification },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AlertDetailComponent);
    fixture.detectChanges();
    await flushAlertDetailUi();
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders only clean alert information', async () => {
    alertApi.getAlertById.mockReturnValue(of({
      alertId: 10,
      alertNumber: 'ALT-10',
      type: 'SYSTEM_ERROR',
      severity: 'CRITICAL',
      status: 'READ',
      channel: 'IN_APP',
      title: 'Movement Reversal Failed',
      message: 'technical jdbc text',
      userMessage: 'Movement reversal failed. Please try again or contact admin.',
      isRead: true,
      isAcknowledged: false,
      isDismissed: false,
      createdAt: '2026-05-13T00:00:00',
      technicalDetails: 'hidden backend detail',
    }));

    await createComponent();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Movement Reversal Failed');
    expect(text).toContain('Movement reversal failed. Please try again or contact admin.');
    expect(text).toContain('Created');
    expect(text).not.toContain('Alert Number');
    expect(text).not.toContain('Source Service');
    expect(text).not.toContain('Recipient Role');
    expect(text).not.toContain('Open Related Workflow');
    expect(text).not.toContain('hidden backend detail');
  });

  it('shows loading and error states safely', async () => {
    const pendingAlert = new Subject<any>();
    alertApi.getAlertById.mockReturnValueOnce(pendingAlert.asObservable());

    await TestBed.configureTestingModule({
      imports: [AlertDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: '10' })),
          },
        },
        { provide: AlertApiService, useValue: alertApi },
        { provide: AuthService, useValue: authService },
        { provide: NotificationService, useValue: notification },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AlertDetailComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loading alert details...');

    pendingAlert.error(new Error('load failed'));
    await flushAlertDetailUi();

    expect(fixture.nativeElement.textContent).toContain('Unable to load alert');
    expect(fixture.nativeElement.textContent).toContain('We could not load this alert right now. Please try again.');
  });

  it('marks unread alerts as read after loading', async () => {
    alertApi.getAlertById.mockReturnValue(of({
      alertId: 10,
      alertNumber: 'ALT-10',
      type: 'GENERAL',
      severity: 'INFO',
      status: 'NEW',
      channel: 'IN_APP',
      title: 'General alert',
      message: 'Please review',
      isRead: false,
      isAcknowledged: false,
      isDismissed: false,
      createdAt: '2026-05-13T00:00:00',
    }));
    alertApi.markAsRead.mockReturnValue(of({
      alertId: 10,
      alertNumber: 'ALT-10',
      type: 'GENERAL',
      severity: 'INFO',
      status: 'READ',
      channel: 'IN_APP',
      title: 'General alert',
      message: 'Please review',
      isRead: true,
      isAcknowledged: false,
      isDismissed: false,
      createdAt: '2026-05-13T00:00:00',
    }));

    await createComponent();

    expect(alertApi.markAsRead).toHaveBeenCalledWith(10);
  });
});
