import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, ProductRequest, PagedResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly base = `${environment.apiUrl}/api/v1/products`;

  constructor(private http: HttpClient) {}

  getAll(page = 0, size = 20, search = '', category = ''): Observable<PagedResponse<Product>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search)   params = params.set('search', search);
    if (category) params = params.set('category', category);
    return this.http.get<PagedResponse<Product>>(this.base, { params });
  }

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.base}/${id}`);
  }

  create(req: ProductRequest): Observable<Product> {
    return this.http.post<Product>(this.base, req);
  }

  update(id: number, req: Partial<ProductRequest>): Observable<Product> {
    return this.http.put<Product>(`${this.base}/${id}`, req);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  getBySku(sku: string): Observable<Product> {
    return this.http.get<Product>(`${this.base}/sku/${sku}`);
  }

  getByBarcode(barcode: string): Observable<Product> {
    return this.http.get<Product>(`${this.base}/barcode/${barcode}`);
  }

  getLowStock(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.base}/low-stock`);
  }
}
