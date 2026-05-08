import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ApprovePurchaseOrderRequest,
  CancelPurchaseOrderRequest,
  CreatePurchaseOrderRequest,
  PageResponse,
  Product,
  PurchaseAnalyticsResponse,
  PurchaseOrderHistoryResponse,
  PurchaseOrderResponse,
  PurchaseOrderSummaryResponse,
  ReceivePurchaseOrderRequest,
  RejectPurchaseOrderRequest,
  SubmitPurchaseOrderRequest,
  SupplierResponse,
  UpdatePurchaseOrderRequest,
  WarehouseResponse,
} from '../../../core/http/backend.models';
import { ApiService } from '../../../core/http/api.service';
import { handleServiceError } from '../../../core/http/http.utils';
import { API_ENDPOINTS } from '../../../shared/config/app-config';
import { PurchaseOrderListQuery } from '../models/purchase-order.model';

@Injectable({ providedIn: 'root' })
export class PurchaseOrderApiService {
  private readonly api = inject(ApiService);
  private readonly serviceName = 'PurchaseOrderApiService';

  createPurchaseOrder(request: CreatePurchaseOrderRequest): Observable<PurchaseOrderResponse> {
    return this.api
      .post<PurchaseOrderResponse>(API_ENDPOINTS.PURCHASE_ORDERS.ROOT, request, {
        headers: { 'X-Skip-Global-Error': 'true' },
      })
      .pipe(handleServiceError(this.serviceName, 'createPurchaseOrder'));
  }

  updatePurchaseOrder(id: number, request: UpdatePurchaseOrderRequest): Observable<PurchaseOrderResponse> {
    return this.api
      .put<PurchaseOrderResponse>(API_ENDPOINTS.PURCHASE_ORDERS.DETAIL(id), request, {
        headers: { 'X-Skip-Global-Error': 'true' },
      })
      .pipe(handleServiceError(this.serviceName, 'updatePurchaseOrder'));
  }

  getPurchaseOrders(query: PurchaseOrderListQuery = {}): Observable<PageResponse<PurchaseOrderResponse>> {
    return this.api
      .get<PageResponse<PurchaseOrderResponse>>(API_ENDPOINTS.PURCHASE_ORDERS.ROOT, {
        params: {
          page: query.page ?? 0,
          size: query.size ?? 10,
          sortBy: query.sortBy ?? 'createdAt',
          sortDir: query.sortDir ?? 'desc',
        },
      })
      .pipe(handleServiceError(this.serviceName, 'getPurchaseOrders'));
  }

  searchPurchaseOrders(query: PurchaseOrderListQuery): Observable<PageResponse<PurchaseOrderResponse>> {
    return this.api
      .get<PageResponse<PurchaseOrderResponse>>(API_ENDPOINTS.PURCHASE_ORDERS.SEARCH, {
        params: {
          keyword: query.keyword,
          supplierId: query.supplierId,
          warehouseId: query.warehouseId,
          status: query.status,
          createdBy: query.createdBy,
          fromDate: query.fromDate,
          toDate: query.toDate,
          overdueOnly: query.overdueOnly,
          page: query.page ?? 0,
          size: query.size ?? 10,
          sortBy: query.sortBy ?? 'createdAt',
          sortDir: query.sortDir ?? 'desc',
        },
      })
      .pipe(handleServiceError(this.serviceName, 'searchPurchaseOrders'));
  }

  getPurchaseOrderById(id: number): Observable<PurchaseOrderResponse> {
    return this.api
      .get<PurchaseOrderResponse>(API_ENDPOINTS.PURCHASE_ORDERS.DETAIL(id))
      .pipe(handleServiceError(this.serviceName, 'getPurchaseOrderById'));
  }

  getPurchaseOrderByNumber(poNumber: string): Observable<PurchaseOrderResponse> {
    return this.api
      .get<PurchaseOrderResponse>(API_ENDPOINTS.PURCHASE_ORDERS.NUMBER(poNumber))
      .pipe(handleServiceError(this.serviceName, 'getPurchaseOrderByNumber'));
  }

  submitPurchaseOrder(id: number, request: SubmitPurchaseOrderRequest = {}): Observable<PurchaseOrderResponse> {
    return this.api
      .post<PurchaseOrderResponse>(API_ENDPOINTS.PURCHASE_ORDERS.SUBMIT(id), request, {
        headers: { 'X-Skip-Global-Error': 'true' },
      })
      .pipe(handleServiceError(this.serviceName, 'submitPurchaseOrder'));
  }

  submitPurchaseOrderForPayment(id: number): Observable<PurchaseOrderResponse> {
    return this.api
      .post<PurchaseOrderResponse>(API_ENDPOINTS.PURCHASE_ORDERS.SUBMIT_FOR_PAYMENT(id), {}, {
        headers: { 'X-Skip-Global-Error': 'true' },
      })
      .pipe(handleServiceError(this.serviceName, 'submitPurchaseOrderForPayment'));
  }

  approvePurchaseOrder(id: number, request: ApprovePurchaseOrderRequest = {}): Observable<PurchaseOrderResponse> {
    return this.api
      .post<PurchaseOrderResponse>(API_ENDPOINTS.PURCHASE_ORDERS.APPROVE(id), request)
      .pipe(handleServiceError(this.serviceName, 'approvePurchaseOrder'));
  }

  rejectPurchaseOrder(id: number, request: RejectPurchaseOrderRequest): Observable<PurchaseOrderResponse> {
    return this.api
      .post<PurchaseOrderResponse>(API_ENDPOINTS.PURCHASE_ORDERS.REJECT(id), request)
      .pipe(handleServiceError(this.serviceName, 'rejectPurchaseOrder'));
  }

  cancelPurchaseOrder(id: number, request: CancelPurchaseOrderRequest): Observable<PurchaseOrderResponse> {
    return this.api
      .post<PurchaseOrderResponse>(API_ENDPOINTS.PURCHASE_ORDERS.CANCEL(id), request)
      .pipe(handleServiceError(this.serviceName, 'cancelPurchaseOrder'));
  }

  receivePurchaseOrder(id: number, request: ReceivePurchaseOrderRequest): Observable<PurchaseOrderResponse> {
    return this.api
      .post<PurchaseOrderResponse>(API_ENDPOINTS.PURCHASE_ORDERS.RECEIVE(id), request)
      .pipe(handleServiceError(this.serviceName, 'receivePurchaseOrder'));
  }

  getPurchaseOrderHistory(id: number): Observable<PurchaseOrderHistoryResponse[]> {
    return this.api
      .get<PurchaseOrderHistoryResponse[]>(API_ENDPOINTS.PURCHASE_ORDERS.HISTORY(id))
      .pipe(handleServiceError(this.serviceName, 'getPurchaseOrderHistory'));
  }

  getPurchaseOrderSummary(): Observable<PurchaseOrderSummaryResponse> {
    return this.api
      .get<PurchaseOrderSummaryResponse>(API_ENDPOINTS.PURCHASE_ORDERS.SUMMARY)
      .pipe(handleServiceError(this.serviceName, 'getPurchaseOrderSummary'));
  }

  getPurchaseOfficerSummary(): Observable<PurchaseOrderSummaryResponse> {
    return this.api
      .get<PurchaseOrderSummaryResponse>(API_ENDPOINTS.PURCHASE_ORDERS.PURCHASE_OFFICER_SUMMARY, {
        headers: { 'X-Skip-Global-Error': 'true' },
      })
      .pipe(handleServiceError(this.serviceName, 'getPurchaseOfficerSummary'));
  }

  getPurchaseAnalytics(fromDate?: string | null, toDate?: string | null): Observable<PurchaseAnalyticsResponse> {
    return this.api
      .get<PurchaseAnalyticsResponse>(API_ENDPOINTS.PURCHASE_ORDERS.ANALYTICS, {
        params: { fromDate, toDate },
      })
      .pipe(handleServiceError(this.serviceName, 'getPurchaseAnalytics'));
  }

  getOverduePurchaseOrders(): Observable<PurchaseOrderResponse[]> {
    return this.api
      .get<PurchaseOrderResponse[]>(API_ENDPOINTS.PURCHASE_ORDERS.OVERDUE)
      .pipe(handleServiceError(this.serviceName, 'getOverduePurchaseOrders'));
  }

  getPendingApprovalPurchaseOrders(): Observable<PurchaseOrderResponse[]> {
    return this.api
      .get<PurchaseOrderResponse[]>(API_ENDPOINTS.PURCHASE_ORDERS.PENDING_APPROVAL)
      .pipe(handleServiceError(this.serviceName, 'getPendingApprovalPurchaseOrders'));
  }

  getSuppliers(): Observable<SupplierResponse[]> {
    return this.api
      .get<SupplierResponse[]>(API_ENDPOINTS.SUPPLIERS.ACTIVE, {
        headers: { 'X-Skip-Global-Error': 'true' },
      })
      .pipe(handleServiceError(this.serviceName, 'getSuppliers'));
  }

  getWarehouses(): Observable<PageResponse<WarehouseResponse>> {
    return this.api
      .get<PageResponse<WarehouseResponse>>(API_ENDPOINTS.WAREHOUSES.ROOT, {
        headers: { 'X-Skip-Global-Error': 'true' },
        params: { isActive: true, page: 0, size: 100, sortBy: 'name', sortDir: 'asc' },
      })
      .pipe(handleServiceError(this.serviceName, 'getWarehouses'));
  }

  getProducts(): Observable<PageResponse<Product>> {
    return this.api
      .get<PageResponse<Product>>(API_ENDPOINTS.PRODUCTS.SEARCH, {
        params: { isActive: true, page: 0, size: 100, sortBy: 'name', sortDir: 'asc' },
      })
      .pipe(handleServiceError(this.serviceName, 'getProducts'));
  }
}
