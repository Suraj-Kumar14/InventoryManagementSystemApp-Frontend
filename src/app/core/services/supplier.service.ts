import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Supplier, PagedResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly base = `${environment.apiUrl}/api/v1/suppliers`;

  constructor(private http: HttpClient) {}

  getAll(page = 0, size = 20, search = ''): Observable<PagedResponse<Supplier>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search) params = params.set('search', search);
    return this.http.get<PagedResponse<Supplier>>(this.base, { params });
  }

  getById(id: number): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.base}/${id}`);
  }

  create(req: Partial<Supplier>): Observable<Supplier> {
    return this.http.post<Supplier>(this.base, req);
  }

  update(id: number, req: Partial<Supplier>): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.base}/${id}`, req);
  }

  updateRating(id: number, rating: number): Observable<Supplier> {
    return this.http.patch<Supplier>(`${this.base}/${id}/rating`, { rating });
  }

  getActive(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(`${this.base}/active`);
  }
}
