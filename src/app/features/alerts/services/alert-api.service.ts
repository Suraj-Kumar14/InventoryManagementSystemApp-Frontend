import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AcknowledgeAlertRequest,
  AlertAnalyticsResponse,
  AlertResponse,
  AlertSearchRequest,
  AlertSummaryResponse,
  CreateAlertRequest,
  CreateBroadcastAlertRequest,
  DismissAlertRequest,
  PageResponse,
} from '../../../core/http/backend.models';
import { ApiService } from '../../../core/http/api.service';
import { handleServiceError } from '../../../core/http/http.utils';
import { API_ENDPOINTS } from '../../../shared/config/app-config';

@Injectable({ providedIn: 'root' })
export class AlertApiService {
  private readonly api = inject(ApiService);
  private readonly serviceName = 'AlertApiService';

  getMyAlerts(filters: Partial<AlertSearchRequest> = {}): Observable<PageResponse<AlertResponse>> {
    return this.api
      .get<PageResponse<AlertResponse>>(API_ENDPOINTS.ALERTS.MY, { params: filters, service: 'alert' })
      .pipe(handleServiceError(this.serviceName, 'getMyAlerts'));
  }

  searchAlerts(filters: Partial<AlertSearchRequest> = {}): Observable<PageResponse<AlertResponse>> {
    return this.api
      .get<PageResponse<AlertResponse>>(API_ENDPOINTS.ALERTS.SEARCH, { params: filters, service: 'alert' })
      .pipe(handleServiceError(this.serviceName, 'searchAlerts'));
  }

  getAlertById(id: number): Observable<AlertResponse> {
    return this.api
      .get<AlertResponse>(API_ENDPOINTS.ALERTS.DETAIL(id), { service: 'alert' })
      .pipe(handleServiceError(this.serviceName, 'getAlertById'));
  }

  getAlertByNumber(alertNumber: string): Observable<AlertResponse> {
    return this.api
      .get<AlertResponse>(API_ENDPOINTS.ALERTS.NUMBER(alertNumber), { service: 'alert' })
      .pipe(handleServiceError(this.serviceName, 'getAlertByNumber'));
  }

  createAlert(request: CreateAlertRequest): Observable<AlertResponse> {
    return this.api
      .post<AlertResponse>(API_ENDPOINTS.ALERTS.ROOT, request, { service: 'alert' })
      .pipe(handleServiceError(this.serviceName, 'createAlert'));
  }

  createBroadcastAlert(request: CreateBroadcastAlertRequest): Observable<AlertResponse[]> {
    return this.api
      .post<AlertResponse[]>(API_ENDPOINTS.ALERTS.BROADCAST, request, { service: 'alert' })
      .pipe(handleServiceError(this.serviceName, 'createBroadcastAlert'));
  }

  markAsRead(id: number): Observable<AlertResponse> {
    return this.api
      .patch<AlertResponse>(API_ENDPOINTS.ALERTS.MARK_READ(id), {}, { service: 'alert' })
      .pipe(handleServiceError(this.serviceName, 'markAsRead'));
  }

  markAllAsRead(): Observable<void> {
    return this.api
      .patch<void>(API_ENDPOINTS.ALERTS.MARK_ALL_READ, {}, { service: 'alert' })
      .pipe(handleServiceError(this.serviceName, 'markAllAsRead'));
  }

  acknowledgeAlert(id: number, request: AcknowledgeAlertRequest = {}): Observable<AlertResponse> {
    return this.api
      .patch<AlertResponse>(API_ENDPOINTS.ALERTS.ACKNOWLEDGE(id), request, { service: 'alert' })
      .pipe(handleServiceError(this.serviceName, 'acknowledgeAlert'));
  }

  dismissAlert(id: number, request: DismissAlertRequest = {}): Observable<AlertResponse> {
    return this.api
      .patch<AlertResponse>(API_ENDPOINTS.ALERTS.DISMISS(id), request, { service: 'alert' })
      .pipe(handleServiceError(this.serviceName, 'dismissAlert'));
  }

  resolveAlert(id: number): Observable<AlertResponse> {
    return this.api
      .patch<AlertResponse>(API_ENDPOINTS.ALERTS.RESOLVE(id), {}, { service: 'alert' })
      .pipe(handleServiceError(this.serviceName, 'resolveAlert'));
  }

  getUnreadCount(): Observable<number> {
    return this.api
      .get<number>(API_ENDPOINTS.ALERTS.UNREAD_COUNT, { service: 'alert' })
      .pipe(handleServiceError(this.serviceName, 'getUnreadCount'));
  }

  getMyAlertSummary(): Observable<AlertSummaryResponse> {
    return this.api
      .get<AlertSummaryResponse>(API_ENDPOINTS.ALERTS.MY_SUMMARY, { service: 'alert' })
      .pipe(handleServiceError(this.serviceName, 'getMyAlertSummary'));
  }

  getSystemAlertSummary(): Observable<AlertSummaryResponse> {
    return this.api
      .get<AlertSummaryResponse>(API_ENDPOINTS.ALERTS.SYSTEM_SUMMARY, { service: 'alert' })
      .pipe(handleServiceError(this.serviceName, 'getSystemAlertSummary'));
  }

  getAlertAnalytics(fromDate?: string, toDate?: string): Observable<AlertAnalyticsResponse> {
    return this.api
      .get<AlertAnalyticsResponse>(API_ENDPOINTS.ALERTS.ANALYTICS, { params: { fromDate, toDate }, service: 'alert' })
      .pipe(handleServiceError(this.serviceName, 'getAlertAnalytics'));
  }
}
