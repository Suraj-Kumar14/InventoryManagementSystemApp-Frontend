import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StockMovement, PagedResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class MovementService {
  private readonly base = `${environment.apiUrl}/api/v1/movements`;

  constructor(private http: HttpClient) {}

  getAll(page = 0, size = 20, filters?: { productId?: number; warehouseId?: number; type?: string; from?: string; to?: string }): Observable<PagedResponse<StockMovement>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (filters?.productId)   params = params.set('productId', filters.productId);
    if (filters?.warehouseId) params = params.set('warehouseId', filters.warehouseId);
    if (filters?.type)        params = params.set('movementType', filters.type);
    if (filters?.from)        params = params.set('fromDate', filters.from);
    if (filters?.to)          params = params.set('toDate', filters.to);
    return this.http.get<PagedResponse<StockMovement>>(this.base, { params });
  }

  getById(id: number): Observable<StockMovement> {
    return this.http.get<StockMovement>(`${this.base}/${id}`);
  }
}
