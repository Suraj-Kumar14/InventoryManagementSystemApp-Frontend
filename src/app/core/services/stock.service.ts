import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StockLevel, StockTransferRequest, StockAdjustRequest, MessageResponse, PagedResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class StockService {
  private readonly base = `${environment.apiUrl}/api/v1/stock`;

  constructor(private http: HttpClient) {}

  getAll(page = 0, size = 20, warehouseId?: number, productId?: number): Observable<PagedResponse<StockLevel>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (warehouseId) params = params.set('warehouseId', warehouseId);
    if (productId)   params = params.set('productId', productId);
    return this.http.get<PagedResponse<StockLevel>>(this.base, { params });
  }

  getByProduct(productId: number, warehouseId?: number): Observable<StockLevel[]> {
    let params = new HttpParams();
    if (warehouseId) params = params.set('warehouseId', warehouseId);
    return this.http.get<StockLevel[]>(`${this.base}/product/${productId}`, { params });
  }

  transfer(req: StockTransferRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.base}/transfer`, req);
  }

  adjust(req: StockAdjustRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.base}/adjust`, req);
  }

  getLowStock(warehouseId?: number): Observable<StockLevel[]> {
    let params = new HttpParams();
    if (warehouseId) params = params.set('warehouseId', warehouseId);
    return this.http.get<StockLevel[]>(`${this.base}/low-stock`, { params });
  }
}
