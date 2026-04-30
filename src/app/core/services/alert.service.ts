import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AlertRequest, AlertResponse } from '../http/backend.models';
import { ApiService } from '../http/api.service';
import { handleServiceError } from '../http/http.utils';
import { API_ENDPOINTS } from '../../shared/config/app-config';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly api = inject(ApiService);
  private readonly serviceName = 'AlertService';

  getAlertsByRecipient(recipientId: number): Observable<AlertResponse[]> {
    return this.api
      .get<AlertResponse[]>(API_ENDPOINTS.ALERTS.BY_RECIPIENT(recipientId), { service: 'alert' })
      .pipe(handleServiceError(this.serviceName, 'getAlertsByRecipient'));
  }

  getUnreadAlerts(recipientId: number): Observable<AlertResponse[]> {
    return this.api
      .get<AlertResponse[]>(API_ENDPOINTS.ALERTS.UNREAD(recipientId), { service: 'alert' })
      .pipe(handleServiceError(this.serviceName, 'getUnreadAlerts'));
  }

  getCriticalAlerts(recipientId: number): Observable<AlertResponse[]> {
    return this.api
      .get<AlertResponse[]>(API_ENDPOINTS.ALERTS.CRITICAL(recipientId), { service: 'alert' })
      .pipe(handleServiceError(this.serviceName, 'getCriticalAlerts'));
  }

  getUnreadCount(recipientId: number): Observable<number> {
    return this.api
      .get<number>(API_ENDPOINTS.ALERTS.UNREAD_COUNT(recipientId), { service: 'alert' })
      .pipe(handleServiceError(this.serviceName, 'getUnreadCount'));
  }

  getRecentAlerts(days = 7): Observable<AlertResponse[]> {
    return this.api
      .get<AlertResponse[]>(API_ENDPOINTS.ALERTS.RECENT, {
        service: 'alert',
        params: { days },
      })
      .pipe(handleServiceError(this.serviceName, 'getRecentAlerts'));
  }

  createAlert(payload: AlertRequest): Observable<AlertResponse> {
    return this.api
      .post<AlertResponse>(API_ENDPOINTS.ALERTS.ROOT, payload, { service: 'alert' })
      .pipe(handleServiceError(this.serviceName, 'createAlert'));
  }

  markRead(id: number): Observable<string> {
    return this.api
      .put<string>(API_ENDPOINTS.ALERTS.MARK_READ(id), {}, {
        service: 'alert',
        responseType: 'text',
      })
      .pipe(handleServiceError(this.serviceName, 'markRead'));
  }

  markAllRead(recipientId: number): Observable<string> {
    return this.api
      .put<string>(API_ENDPOINTS.ALERTS.MARK_ALL_READ(recipientId), {}, {
        service: 'alert',
        responseType: 'text',
      })
      .pipe(handleServiceError(this.serviceName, 'markAllRead'));
  }

  acknowledgeAlert(id: number): Observable<string> {
    return this.api
      .put<string>(API_ENDPOINTS.ALERTS.ACKNOWLEDGE(id), {}, {
        service: 'alert',
        responseType: 'text',
      })
      .pipe(handleServiceError(this.serviceName, 'acknowledgeAlert'));
  }
}
