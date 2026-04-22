import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Warehouse, PagedResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class WarehouseService {
  private readonly base = `${environment.apiUrl}/api/v1/warehouses`;

  constructor(private http: HttpClient) {}

  getAll(page = 0, size = 20): Observable<PagedResponse<Warehouse>> {
    return this.http.get<PagedResponse<Warehouse>>(this.base, {
      params: { page, size }
    });
  }

  getById(id: number): Observable<Warehouse> {
    return this.http.get<Warehouse>(`${this.base}/${id}`);
  }

  create(req: Partial<Warehouse>): Observable<Warehouse> {
    return this.http.post<Warehouse>(this.base, req);
  }

  update(id: number, req: Partial<Warehouse>): Observable<Warehouse> {
    return this.http.put<Warehouse>(`${this.base}/${id}`, req);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  getActive(): Observable<Warehouse[]> {
    return this.http.get<Warehouse[]>(`${this.base}/active`);
  }
}
