import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreatePurchaseOrderRequest,
  POLineItem,
  PagedResponse,
  PoStatus,
  PurchaseOrder,
  PurchaseOrderFilter,
  ReceiveGoodsRequest,
  UpdatePurchaseOrderRequest
} from '../models';

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/purchase-orders`;
  private readonly lifecycleStatuses: PoStatus[] = [
    'DRAFT',
    'PENDING_APPROVAL',
    'APPROVED',
    'PARTIALLY_RECEIVED',
    'FULLY_RECEIVED',
    'CANCELLED'
  ];

  private cachedOrders = new Map<number, PurchaseOrder>();

  getPOs(filter: PurchaseOrderFilter = {}): Observable<PagedResponse<PurchaseOrder>> {
    const normalizedFilter = this.normalizeFilter(filter);
    const source$ =
      normalizedFilter.startDate && normalizedFilter.endDate
        ? this.getPOsByDateRange(normalizedFilter.startDate, normalizedFilter.endDate)
        : normalizedFilter.status && normalizedFilter.status !== 'ALL'
          ? this.getPOsByStatus(normalizedFilter.status)
          : this.getAllKnownOrders();

    return source$.pipe(
      map((orders) => this.filterAndPaginateOrders(orders, normalizedFilter))
    );
  }

  getAll(page = 0, size = 20, status?: string): Observable<PagedResponse<PurchaseOrder>> {
    return this.getPOs({
      page,
      size,
      status: (status as PoStatus | 'ALL' | '') ?? 'ALL'
    });
  }

  getPOById(id: number): Observable<PurchaseOrder> {
    const cachedOrder = this.cachedOrders.get(id);
    if (cachedOrder) {
      return of(cachedOrder);
    }

    return this.getAllKnownOrders().pipe(
      map((orders) => {
        const order = orders.find((candidate) => candidate.id === id);
        if (!order) {
          throw new Error(`Purchase order ${id} was not found.`);
        }
        return order;
      })
    );
  }

  getById(id: number): Observable<PurchaseOrder> {
    return this.getPOById(id);
  }

  createPO(payload: CreatePurchaseOrderRequest): Observable<PurchaseOrder> {
    return this.http
      .post<unknown>(this.base, this.toBackendCreatePayload(payload))
      .pipe(map((response) => this.persistOrder(this.normalizePurchaseOrder(this.unwrapApiResponse(response)))));
  }

  create(payload: CreatePurchaseOrderRequest): Observable<PurchaseOrder> {
    return this.createPO(payload);
  }

  updatePO(_id: number, _payload: UpdatePurchaseOrderRequest): Observable<PurchaseOrder> {
    return throwError(() => new Error('Update is not exposed by the current purchase-service backend.'));
  }

  update(id: number, payload: UpdatePurchaseOrderRequest): Observable<PurchaseOrder> {
    return this.updatePO(id, payload);
  }

  approvePO(id: number): Observable<PurchaseOrder> {
    return this.http
      .put<unknown>(`${this.base}/${id}/approve`, {})
      .pipe(map((response) => this.persistOrder(this.normalizePurchaseOrder(this.unwrapApiResponse(response)))));
  }

  approve(id: number): Observable<PurchaseOrder> {
    return this.approvePO(id);
  }

  cancelPO(id: number): Observable<PurchaseOrder> {
    return this.http
      .put<unknown>(`${this.base}/${id}/cancel`, {})
      .pipe(map((response) => this.persistOrder(this.normalizePurchaseOrder(this.unwrapApiResponse(response)))));
  }

  cancel(id: number): Observable<PurchaseOrder> {
    return this.cancelPO(id);
  }

  receiveGoods(id: number, payload: ReceiveGoodsRequest | ReceiveGoodsRequest['items']): Observable<PurchaseOrder> {
    const items = Array.isArray(payload) ? payload : payload.items;

    return this.http
      .post<unknown>(
        `${this.base}/${id}/receive`,
        items.map((item) => ({
          lineItemId: item.lineItemId ?? null,
          productId: item.productId ?? null,
          receivedQty: Number(item.receivedQty ?? 0)
        }))
      )
      .pipe(map((response) => this.persistOrder(this.normalizePurchaseOrder(this.unwrapApiResponse(response)))));
  }

  getPOsBySupplier(supplierId: number): Observable<PurchaseOrder[]> {
    return this.getAllKnownOrders().pipe(
      map((orders) => orders.filter((order) => order.supplierId === supplierId))
    );
  }

  getPOsByStatus(status: PoStatus): Observable<PurchaseOrder[]> {
    return this.http
      .get<unknown>(`${this.base}/status/${encodeURIComponent(status)}`)
      .pipe(map((response) => this.normalizePurchaseOrderCollection(response)));
  }

  getPOsByWarehouse(warehouseId: number): Observable<PurchaseOrder[]> {
    return this.getAllKnownOrders().pipe(
      map((orders) => orders.filter((order) => order.warehouseId === warehouseId))
    );
  }

  getPOsByDateRange(startDate: string, endDate: string): Observable<PurchaseOrder[]> {
    const params = new HttpParams()
      .set('start', startDate)
      .set('end', endDate);

    return this.http
      .get<unknown>(`${this.base}/date-range`, { params })
      .pipe(map((response) => this.normalizePurchaseOrderCollection(response)));
  }

  private getAllKnownOrders(): Observable<PurchaseOrder[]> {
    return forkJoin(
      this.lifecycleStatuses.map((status) => this.getPOsByStatus(status))
    ).pipe(
      map((collections) => {
        const merged = collections.flat();
        const deduped = new Map<number, PurchaseOrder>();

        for (const order of merged) {
          deduped.set(order.id, order);
        }

        const orders = Array.from(deduped.values());
        this.replaceCache(orders);
        return orders;
      })
    );
  }

  private filterAndPaginateOrders(
    orders: PurchaseOrder[],
    filter: Required<PurchaseOrderFilter>
  ): PagedResponse<PurchaseOrder> {
    const filtered = orders.filter((order) => {
      const matchesStatus =
        filter.status === 'ALL' || !filter.status ? true : order.status === filter.status;
      const matchesSupplier =
        filter.supplierId == null || order.supplierId === filter.supplierId;
      const matchesWarehouse =
        filter.warehouseId == null || order.warehouseId === filter.warehouseId;
      const matchesStartDate =
        !filter.startDate || !order.orderDate || order.orderDate >= filter.startDate;
      const matchesEndDate =
        !filter.endDate || !order.orderDate || order.orderDate <= filter.endDate;

      const keyword = (filter.referenceNumber || filter.search).trim().toLowerCase();
      const matchesKeyword =
        !keyword ||
        order.poNumber.toLowerCase().includes(keyword) ||
        (order.referenceNumber ?? '').toLowerCase().includes(keyword) ||
        String(order.id).includes(keyword) ||
        (order.notes ?? '').toLowerCase().includes(keyword);

      return (
        matchesStatus &&
        matchesSupplier &&
        matchesWarehouse &&
        matchesStartDate &&
        matchesEndDate &&
        matchesKeyword
      );
    });

    const sorted = this.sortOrders(filtered, filter.sortBy, filter.sortDir);
    const startIndex = filter.page * filter.size;
    const content = sorted.slice(startIndex, startIndex + filter.size);
    const totalPages = Math.max(Math.ceil(sorted.length / filter.size), 1);

    this.replaceCache(sorted);

    return {
      content,
      page: filter.page,
      size: filter.size,
      totalElements: sorted.length,
      totalPages,
      first: filter.page === 0,
      last: filter.page >= totalPages - 1
    };
  }

  private sortOrders(
    orders: PurchaseOrder[],
    sortBy: string,
    sortDir: 'asc' | 'desc'
  ): PurchaseOrder[] {
    const direction = sortDir === 'asc' ? 1 : -1;

    return [...orders].sort((left, right) => {
      const leftValue = this.resolveSortValue(left, sortBy);
      const rightValue = this.resolveSortValue(right, sortBy);

      if (leftValue == null && rightValue == null) {
        return 0;
      }

      if (leftValue == null) {
        return 1;
      }

      if (rightValue == null) {
        return -1;
      }

      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        return (leftValue - rightValue) * direction;
      }

      return String(leftValue).localeCompare(String(rightValue), undefined, {
        numeric: true,
        sensitivity: 'base'
      }) * direction;
    });
  }

  private resolveSortValue(order: PurchaseOrder, sortBy: string): string | number | null {
    switch (sortBy) {
      case 'status':
        return order.status;
      case 'totalAmount':
        return order.totalAmount;
      case 'expectedDate':
        return order.expectedDate ?? '';
      case 'referenceNumber':
        return order.referenceNumber ?? '';
      case 'supplierId':
        return order.supplierId;
      case 'warehouseId':
        return order.warehouseId;
      case 'orderDate':
      default:
        return order.orderDate ?? '';
    }
  }

  private toBackendCreatePayload(payload: CreatePurchaseOrderRequest): Record<string, unknown> {
    return {
      supplierId: Number(payload.supplierId),
      warehouseId: Number(payload.warehouseId),
      createdById: this.asNullableNumber(payload.createdById),
      status: payload.status ?? 'DRAFT',
      orderDate: payload.orderDate?.trim() || null,
      expectedDate: payload.expectedDate?.trim() || null,
      notes: payload.notes?.trim() || null,
      referenceNumber: payload.referenceNumber?.trim() || null,
      lineItems: payload.lineItems.map((lineItem) => {
        const quantity = Math.max(Number(lineItem.quantity ?? 0), 0);
        const unitCost = Math.max(Number(lineItem.unitCost ?? 0), 0);

        return {
          productId: Number(lineItem.productId),
          quantity,
          unitCost,
          totalCost: Number(lineItem.totalCost ?? quantity * unitCost),
          receivedQty: Number(lineItem.receivedQty ?? 0)
        };
      })
    };
  }

  private normalizePurchaseOrderCollection(response: unknown): PurchaseOrder[] {
    const payload = this.unwrapApiResponse(response);

    if (Array.isArray(payload)) {
      return payload.map((item) => this.persistOrder(this.normalizePurchaseOrder(item)));
    }

    const record = this.asRecord(payload);
    const source =
      this.readArray(record['content']) ??
      this.readArray(record['items']) ??
      this.readArray(record['purchaseOrders']) ??
      [];

    return source.map((item) => this.persistOrder(this.normalizePurchaseOrder(item)));
  }

  private normalizePurchaseOrder(value: unknown): PurchaseOrder {
    const order = this.asRecord(value);
    const poId = this.asNumber(order['poId'] ?? order['id']);
    const referenceNumber = this.asNullableString(order['referenceNumber'] ?? order['poNumber']);
    const lineItems = (
      this.readArray(order['lineItems']) ??
      this.readArray(order['items']) ??
      []
    ).map((item) => this.normalizeLineItem(item, poId));
    const totalAmount = this.asNumber(
      order['totalAmount'] ??
      lineItems.reduce((sum, lineItem) => sum + Number(lineItem.totalCost ?? 0), 0)
    );
    const orderDate = this.asString(order['orderDate'] ?? order['createdAt']);
    const expectedDate = this.asNullableString(order['expectedDate'] ?? order['expectedDeliveryDate']);
    const receivedDate = this.asNullableString(order['receivedDate']);
    const status = this.normalizeStatus(order['status']);
    const receivedPercent = this.calculateReceivedPercent(lineItems);

    return {
      poId,
      id: poId,
      supplierId: this.asNumber(order['supplierId']),
      supplierName: this.asNullableString(order['supplierName']) ?? undefined,
      warehouseId: this.asNumber(order['warehouseId']),
      warehouseName: this.asNullableString(order['warehouseName']) ?? undefined,
      createdById: this.asNumber(order['createdById'] ?? order['createdBy']),
      createdBy: this.asNullableString(order['createdBy']) ?? undefined,
      status,
      totalAmount,
      orderDate,
      expectedDate,
      expectedDeliveryDate: expectedDate,
      receivedDate,
      notes: this.asNullableString(order['notes']),
      referenceNumber,
      poNumber: referenceNumber ?? (poId ? `PO-${poId}` : 'Draft PO'),
      lineItems,
      items: lineItems,
      approvedBy: this.asNullableString(order['approvedBy']) ?? undefined,
      approvedAt: this.asNullableString(order['approvedAt']) ?? undefined,
      createdAt: orderDate,
      updatedAt: this.asString(order['updatedAt'] ?? receivedDate ?? orderDate),
      receivedPercent
    };
  }

  private normalizeLineItem(value: unknown, poId: number): POLineItem {
    const lineItem = this.asRecord(value);
    const lineItemId = this.asNullableNumber(lineItem['lineItemId'] ?? lineItem['id']) ?? undefined;
    const quantity = this.asNumber(lineItem['quantity'] ?? lineItem['orderedQuantity']);
    const unitCost = this.asNumber(lineItem['unitCost'] ?? lineItem['unitPrice']);
    const receivedQty = this.asNumber(lineItem['receivedQty'] ?? lineItem['receivedQuantity']);
    const totalCost = this.asNumber(
      lineItem['totalCost'] ??
      lineItem['totalPrice'] ??
      quantity * unitCost
    );

    return {
      lineItemId,
      id: lineItemId,
      poId,
      productId: this.asNumber(lineItem['productId']),
      productName: this.asNullableString(lineItem['productName']) ?? undefined,
      sku: this.asNullableString(lineItem['sku']) ?? undefined,
      quantity,
      orderedQuantity: quantity,
      unitCost,
      unitPrice: unitCost,
      totalCost,
      totalPrice: totalCost,
      receivedQty,
      receivedQuantity: receivedQty,
      remainingQty: Math.max(quantity - receivedQty, 0)
    };
  }

  private calculateReceivedPercent(lineItems: POLineItem[]): number {
    const totalQuantity = lineItems.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
    const totalReceived = lineItems.reduce((sum, item) => sum + Number(item.receivedQty ?? 0), 0);

    if (totalQuantity <= 0) {
      return 0;
    }

    return Math.min((totalReceived / totalQuantity) * 100, 100);
  }

  private normalizeFilter(filter: PurchaseOrderFilter): Required<PurchaseOrderFilter> {
    return {
      page: Math.max(Number(filter.page ?? 0), 0),
      size: Math.max(Number(filter.size ?? 20), 1),
      status: filter.status ?? 'ALL',
      supplierId: this.asNullableNumber(filter.supplierId),
      warehouseId: this.asNullableNumber(filter.warehouseId),
      startDate: filter.startDate?.trim() || '',
      endDate: filter.endDate?.trim() || '',
      referenceNumber: filter.referenceNumber?.trim() || '',
      search: filter.search?.trim() || '',
      sortBy: filter.sortBy?.trim() || 'orderDate',
      sortDir: filter.sortDir === 'asc' ? 'asc' : 'desc'
    };
  }

  private normalizeStatus(value: unknown): PoStatus {
    const normalized = this.asString(value).toUpperCase();

    switch (normalized) {
      case 'DRAFT':
      case 'PENDING_APPROVAL':
      case 'APPROVED':
      case 'PARTIALLY_RECEIVED':
      case 'FULLY_RECEIVED':
      case 'CANCELLED':
        return normalized;
      case 'RECEIVED':
        return 'FULLY_RECEIVED';
      default:
        return 'DRAFT';
    }
  }

  private persistOrder(order: PurchaseOrder): PurchaseOrder {
    this.cachedOrders.set(order.id, order);
    return order;
  }

  private replaceCache(orders: PurchaseOrder[]): void {
    this.cachedOrders = new Map(orders.map((order) => [order.id, order]));
  }

  private unwrapApiResponse<T>(response: unknown): T {
    const record = this.asRecord(response);

    if ('data' in record) {
      return record['data'] as T;
    }

    return response as T;
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  }

  private readArray(value: unknown): unknown[] | null {
    return Array.isArray(value) ? value : null;
  }

  private asString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private asNullableString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private asNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private asNullableNumber(value: unknown): number | null {
    if (value == null || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
