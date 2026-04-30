import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  GoodsReceiptRequest,
  PurchaseOrderRequest,
  PurchaseOrderResponse,
  SupplierRequest,
  SupplierResponse,
} from '../http/backend.models';
import { ApiService } from '../http/api.service';
import { handleServiceError } from '../http/http.utils';
import { API_ENDPOINTS } from '../../shared/config/app-config';

export interface SupplierQuery {
  keyword?: string;
  name?: string;
  city?: string;
  country?: string;
  page?: number;
  size?: number;
  activeOnly?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private readonly api = inject(ApiService);
  private readonly serviceName = 'PurchaseService';

  getPurchaseOrders(): Observable<PurchaseOrderResponse[]> {
    return this.api
      .get<PurchaseOrderResponse[]>(API_ENDPOINTS.PURCHASE_ORDERS.ROOT, { service: 'purchase' })
      .pipe(handleServiceError(this.serviceName, 'getPurchaseOrders'));
  }

  getPurchaseOrderById(id: number): Observable<PurchaseOrderResponse> {
    return this.api
      .get<PurchaseOrderResponse>(`${API_ENDPOINTS.PURCHASE_ORDERS.ROOT}/${id}`, { service: 'purchase' })
      .pipe(handleServiceError(this.serviceName, 'getPurchaseOrderById'));
  }

  getPurchaseOrdersByStatus(status: string): Observable<PurchaseOrderResponse[]> {
    return this.api
      .get<PurchaseOrderResponse[]>(API_ENDPOINTS.PURCHASE_ORDERS.BY_STATUS(status), { service: 'purchase' })
      .pipe(handleServiceError(this.serviceName, 'getPurchaseOrdersByStatus'));
  }

  getOverduePurchaseOrders(): Observable<PurchaseOrderResponse[]> {
    return this.api
      .get<PurchaseOrderResponse[]>(API_ENDPOINTS.PURCHASE_ORDERS.OVERDUE, { service: 'purchase' })
      .pipe(handleServiceError(this.serviceName, 'getOverduePurchaseOrders'));
  }

  createPurchaseOrder(payload: PurchaseOrderRequest): Observable<PurchaseOrderResponse> {
    return this.api
      .post<PurchaseOrderResponse>(API_ENDPOINTS.PURCHASE_ORDERS.ROOT, payload, { service: 'purchase' })
      .pipe(handleServiceError(this.serviceName, 'createPurchaseOrder'));
  }

  updatePurchaseOrder(id: number, payload: PurchaseOrderRequest): Observable<PurchaseOrderResponse> {
    return this.api
      .put<PurchaseOrderResponse>(`${API_ENDPOINTS.PURCHASE_ORDERS.ROOT}/${id}`, payload, { service: 'purchase' })
      .pipe(handleServiceError(this.serviceName, 'updatePurchaseOrder'));
  }

  submitPurchaseOrder(id: number): Observable<PurchaseOrderResponse> {
    return this.api
      .put<PurchaseOrderResponse>(API_ENDPOINTS.PURCHASE_ORDERS.SUBMIT(id), {}, { service: 'purchase' })
      .pipe(handleServiceError(this.serviceName, 'submitPurchaseOrder'));
  }

  approvePurchaseOrder(id: number): Observable<PurchaseOrderResponse> {
    return this.api
      .put<PurchaseOrderResponse>(API_ENDPOINTS.PURCHASE_ORDERS.APPROVE(id), {}, { service: 'purchase' })
      .pipe(handleServiceError(this.serviceName, 'approvePurchaseOrder'));
  }

  rejectPurchaseOrder(id: number, reason: string): Observable<PurchaseOrderResponse> {
    return this.api
      .put<PurchaseOrderResponse>(API_ENDPOINTS.PURCHASE_ORDERS.REJECT(id), { reason }, { service: 'purchase' })
      .pipe(handleServiceError(this.serviceName, 'rejectPurchaseOrder'));
  }

  cancelPurchaseOrder(id: number, reason: string): Observable<PurchaseOrderResponse> {
    return this.api
      .put<PurchaseOrderResponse>(API_ENDPOINTS.PURCHASE_ORDERS.CANCEL(id), { reason }, { service: 'purchase' })
      .pipe(handleServiceError(this.serviceName, 'cancelPurchaseOrder'));
  }

  receiveGoods(id: number, payload: GoodsReceiptRequest[]): Observable<PurchaseOrderResponse> {
    return this.api
      .post<PurchaseOrderResponse>(API_ENDPOINTS.PURCHASE_ORDERS.RECEIVE_GOODS(id), payload, { service: 'purchase' })
      .pipe(handleServiceError(this.serviceName, 'receiveGoods'));
  }

  getSuppliers(query: SupplierQuery = {}): Observable<SupplierResponse[]> {
    if (query.activeOnly) {
      return this.api
        .get<SupplierResponse[]>(API_ENDPOINTS.SUPPLIERS.ACTIVE, { service: 'supplier' })
        .pipe(handleServiceError(this.serviceName, 'getSuppliers(activeOnly)'));
    }

    if (query.keyword || query.name || query.city || query.country || query.page !== undefined || query.size !== undefined) {
      return this.api
        .get<SupplierResponse[]>(API_ENDPOINTS.SUPPLIERS.SEARCH, {
          service: 'supplier',
          params: {
            keyword: query.keyword,
            name: query.name,
            city: query.city,
            country: query.country,
            page: query.page,
            size: query.size,
          },
        })
        .pipe(handleServiceError(this.serviceName, 'getSuppliers(search)'));
    }

    return this.api
      .get<SupplierResponse[]>(API_ENDPOINTS.SUPPLIERS.ROOT, { service: 'supplier' })
      .pipe(handleServiceError(this.serviceName, 'getSuppliers'));
  }

  getTopRatedSuppliers(minRating = 0): Observable<SupplierResponse[]> {
    return this.api
      .get<SupplierResponse[]>(API_ENDPOINTS.SUPPLIERS.TOP_RATED, {
        service: 'supplier',
        params: { minRating },
      })
      .pipe(handleServiceError(this.serviceName, 'getTopRatedSuppliers'));
  }

  createSupplier(payload: SupplierRequest): Observable<SupplierResponse> {
    return this.api
      .post<SupplierResponse>(API_ENDPOINTS.SUPPLIERS.ROOT, payload, { service: 'supplier' })
      .pipe(handleServiceError(this.serviceName, 'createSupplier'));
  }

  updateSupplier(id: number, payload: SupplierRequest): Observable<SupplierResponse> {
    return this.api
      .put<SupplierResponse>(`${API_ENDPOINTS.SUPPLIERS.ROOT}/${id}`, payload, { service: 'supplier' })
      .pipe(handleServiceError(this.serviceName, 'updateSupplier'));
  }

  deactivateSupplier(id: number): Observable<string> {
    return this.api
      .put<string>(API_ENDPOINTS.SUPPLIERS.DEACTIVATE(id), {}, {
        service: 'supplier',
        responseType: 'text',
      })
      .pipe(handleServiceError(this.serviceName, 'deactivateSupplier'));
  }

  deleteSupplier(id: number): Observable<string> {
    return this.api
      .delete<string>(`${API_ENDPOINTS.SUPPLIERS.ROOT}/${id}`, {
        service: 'supplier',
        responseType: 'text',
      })
      .pipe(handleServiceError(this.serviceName, 'deleteSupplier'));
  }
}
