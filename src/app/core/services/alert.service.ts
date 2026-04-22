import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Alert, UnreadCountResponse, PagedResponse, MessageResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly base = `${environment.apiUrl}/api/v1/alerts`;

  constructor(private http: HttpClient) {}

  getMyAlerts(page = 0, size = 20, unreadOnly = false): Observable<PagedResponse<Alert>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (unreadOnly) params = params.set('unreadOnly', true);
    return this.http.get<PagedResponse<Alert>>(`${this.base}/my`, { params });
  }

  getUnreadCount(): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(`${this.base}/unread-count`);
  }

  markAsRead(id: number): Observable<MessageResponse> {
    return this.http.patch<MessageResponse>(`${this.base}/${id}/read`, {});
  }

  markAllRead(): Observable<MessageResponse> {
    return this.http.patch<MessageResponse>(`${this.base}/mark-all-read`, {});
  }

  acknowledge(id: number): Observable<MessageResponse> {
    return this.http.patch<MessageResponse>(`${this.base}/${id}/acknowledge`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
