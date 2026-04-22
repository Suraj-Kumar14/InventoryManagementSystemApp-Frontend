import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PurchaseOrder, CreatePoRequest, PagedResponse, MessageResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  private readonly base = `${environment.apiUrl}/api/v1/purchase-orders`;

  constructor(private http: HttpClient) {}

  getAll(page = 0, size = 20, status?: string): Observable<PagedResponse<PurchaseOrder>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    return this.http.get<PagedResponse<PurchaseOrder>>(this.base, { params });
  }

  getById(id: number): Observable<PurchaseOrder> {
    return this.http.get<PurchaseOrder>(`${this.base}/${id}`);
  }

  create(req: CreatePoRequest): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(this.base, req);
  }

  update(id: number, req: Partial<CreatePoRequest>): Observable<PurchaseOrder> {
    return this.http.put<PurchaseOrder>(`${this.base}/${id}`, req);
  }

  approve(id: number, notes?: string): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.base}/${id}/approve`, { notes });
  }

  reject(id: number, reason: string): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.base}/${id}/reject`, { reason });
  }

  cancel(id: number, reason: string): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.base}/${id}/cancel`, { reason });
  }

  receiveGoods(id: number, items: { purchaseOrderItemId: number; receivedQuantity: number }[]): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.base}/${id}/receive`, { items });
  }
}
