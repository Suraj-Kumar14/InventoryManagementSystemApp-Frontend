import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from '../../../core/http/api.service';
import { AlertApiService } from './alert-api.service';

describe('AlertApiService', () => {
  let service: AlertApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AlertApiService, ApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AlertApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should call my alerts API', () => {
    service.getMyAlerts({ page: 0, size: 5 }).subscribe();

    const request = httpMock.expectOne((req) => req.method === 'GET' && req.url === 'http://localhost:8080/api/v1/alerts/my');
    request.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 5, numberOfElements: 0, first: true, last: true, empty: true });
  });

  it('should call unread count API', () => {
    service.getUnreadCount().subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/alerts/unread-count');
    expect(request.request.method).toBe('GET');
    request.flush(3);
  });

  it('should call mark as read API', () => {
    service.markAsRead(10).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/alerts/10/read');
    expect(request.request.method).toBe('PATCH');
    request.flush({ alertId: 10, alertNumber: 'ALT-20260501-000010', type: 'GENERAL', severity: 'INFO', status: 'READ', channel: 'IN_APP', title: 'Title', message: 'Message', isRead: true, isAcknowledged: false, isDismissed: false });
  });

  it('should call acknowledge API', () => {
    service.acknowledgeAlert(10, { remarks: 'Handled' }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/alerts/10/acknowledge');
    expect(request.request.method).toBe('PATCH');
    request.flush({ alertId: 10, alertNumber: 'ALT-20260501-000010', type: 'GENERAL', severity: 'INFO', status: 'ACKNOWLEDGED', channel: 'IN_APP', title: 'Title', message: 'Message', isRead: true, isAcknowledged: true, isDismissed: false });
  });

  it('should call dismiss API', () => {
    service.dismissAlert(10, { reason: 'Not relevant' }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/alerts/10/dismiss');
    expect(request.request.method).toBe('PATCH');
    request.flush({ alertId: 10, alertNumber: 'ALT-20260501-000010', type: 'GENERAL', severity: 'INFO', status: 'DISMISSED', channel: 'IN_APP', title: 'Title', message: 'Message', isRead: true, isAcknowledged: false, isDismissed: true });
  });

  it('should call broadcast API', () => {
    service.createBroadcastAlert({
      recipientRoles: ['INVENTORY_MANAGER'],
      severity: 'WARNING',
      title: 'Broadcast',
      message: 'Check stock',
    }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/alerts/broadcast');
    expect(request.request.method).toBe('POST');
    expect(request.request.body.recipientRoles).toEqual(['INVENTORY_MANAGER']);
    request.flush([]);
  });

  it('should call summary API', () => {
    service.getMyAlertSummary().subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/alerts/summary/my');
    expect(request.request.method).toBe('GET');
    request.flush({ totalAlerts: 1, unreadCount: 1, acknowledgedCount: 0, dismissedCount: 0, criticalCount: 0, warningCount: 1, infoCount: 0, lowStockCount: 1, overstockCount: 0, pendingPoApprovalCount: 0, overduePoCount: 0 });
  });

  it('should call analytics API', () => {
    service.getAlertAnalytics('2026-05-01', '2026-05-02').subscribe();

    const request = httpMock.expectOne((req) => req.method === 'GET' && req.url === 'http://localhost:8080/api/v1/alerts/analytics');
    expect(request.request.params.get('fromDate')).toBe('2026-05-01');
    request.flush({ alertsByType: {}, alertsBySeverity: {}, alertsByStatus: {}, alertsByRole: {}, dailyAlertTrend: {}, topAlertedProducts: [], topAlertedWarehouses: [] });
  });
});
