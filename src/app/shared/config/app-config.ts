export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  OFFICER = 'OFFICER',
  STAFF = 'STAFF',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrator',
  [UserRole.MANAGER]: 'Inventory Manager',
  [UserRole.OFFICER]: 'Purchase Officer',
  [UserRole.STAFF]: 'Warehouse Staff',
};

export const ROLE_PAGES: Record<UserRole, string> = {
  [UserRole.ADMIN]: '/dashboard/admin',
  [UserRole.MANAGER]: '/dashboard/manager',
  [UserRole.OFFICER]: '/dashboard/officer',
  [UserRole.STAFF]: '/dashboard/staff',
};

export const ROLE_REGISTRATION_ALLOWED: UserRole[] = [
  UserRole.MANAGER,
  UserRole.OFFICER,
  UserRole.STAFF,
];

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY_OTP: '/auth/verify-otp',
    REFRESH_TOKEN: '/auth/refresh',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    PROFILE: '/auth/profile',
    UPDATE_PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/password',
    USERS: '/auth/users',
    DEACTIVATE_USER: (id: number) => `/auth/user/${id}`,
    GOOGLE_LOGIN: '/oauth2/authorization/google',
  },
  PRODUCTS: {
    ROOT: '/products',
    ACTIVE: '/products/active',
    SEARCH: '/products/search',
    CATEGORY: (category: string) => `/products/category/${category}`,
    BRAND: (brand: string) => `/products/brand/${brand}`,
    BARCODE: (barcode: string) => `/products/barcode/${barcode}`,
    DEACTIVATE: (id: number) => `/products/${id}/deactivate`,
  },
  SUPPLIERS: {
    ROOT: '/suppliers',
    ACTIVE: '/suppliers/active',
    SEARCH: '/suppliers/search',
    TOP_RATED: '/suppliers/top-rated',
    CITY: (city: string) => `/suppliers/city/${city}`,
    COUNTRY: (country: string) => `/suppliers/country/${country}`,
    RATING: (id: number) => `/suppliers/${id}/rating`,
    DEACTIVATE: (id: number) => `/suppliers/${id}/deactivate`,
  },
  WAREHOUSES: {
    ROOT: '/warehouses',
    ACTIVE: '/warehouses/active',
    MANAGER: (managerId: number) => `/warehouses/manager/${managerId}`,
    DEACTIVATE: (id: number) => `/warehouses/${id}/deactivate`,
    ASSIGN_MANAGER: (warehouseId: number, managerId: number) =>
      `/warehouses/${warehouseId}/manager/${managerId}`,
  },
  STOCK: {
    ROOT: '/stock',
    BY_WAREHOUSE: (warehouseId: number) => `/stock/warehouse/${warehouseId}`,
    BY_PRODUCT: (productId: number) => `/stock/product/${productId}`,
    BY_WAREHOUSE_AND_PRODUCT: (warehouseId: number, productId: number) =>
      `/stock/warehouse/${warehouseId}/product/${productId}`,
    UPDATE: (warehouseId: number) => `/stock/warehouse/${warehouseId}/update`,
    RESERVE: '/stock/reserve',
    RELEASE: '/stock/release',
    TRANSFER: '/stock/transfer',
    LOW_STOCK: '/stock/low-stock',
    MOVEMENTS: '/stock/movements',
    AUDIT: '/stock/audit',
    BARCODE: (barcode: string) => `/stock/barcode/${barcode}`,
    ALERTS: '/stock/alerts',
    ACKNOWLEDGE_ALERT: (alertId: number) => `/stock/alerts/${alertId}/acknowledge`,
  },
  PURCHASE_ORDERS: {
    ROOT: '/purchase-orders',
    OVERDUE: '/purchase-orders/overdue',
    BY_SUPPLIER: (supplierId: number) => `/purchase-orders/supplier/${supplierId}`,
    BY_WAREHOUSE: (warehouseId: number) => `/purchase-orders/warehouse/${warehouseId}`,
    BY_STATUS: (status: string) => `/purchase-orders/status/${status}`,
    BY_CREATED_BY: (userId: number) => `/purchase-orders/created-by/${userId}`,
    DATE_RANGE: '/purchase-orders/date-range',
    SUBMIT: (id: number) => `/purchase-orders/${id}/submit`,
    APPROVE: (id: number) => `/purchase-orders/${id}/approve`,
    REJECT: (id: number) => `/purchase-orders/${id}/reject`,
    CANCEL: (id: number) => `/purchase-orders/${id}/cancel`,
    RECEIVE_GOODS: (id: number) => `/purchase-orders/${id}/receive-goods`,
  },
  MOVEMENTS: {
    ROOT: '/movements',
    BY_PRODUCT: (productId: number) => `/movements/product/${productId}`,
    BY_WAREHOUSE: (warehouseId: number) => `/movements/warehouse/${warehouseId}`,
    BY_TYPE: (type: string) => `/movements/type/${type}`,
    BY_REFERENCE: (referenceId: number) => `/movements/reference/${referenceId}`,
    BY_PERFORMED_BY: (userId: number) => `/movements/performed-by/${userId}`,
    DATE_RANGE: '/movements/date-range',
    HISTORY: (productId: number, warehouseId: number) =>
      `/movements/history/product/${productId}/warehouse/${warehouseId}`,
    STOCK_IN: (productId: number, warehouseId: number) =>
      `/movements/stock-in/product/${productId}/warehouse/${warehouseId}`,
    STOCK_OUT: (productId: number, warehouseId: number) =>
      `/movements/stock-out/product/${productId}/warehouse/${warehouseId}`,
  },
  ALERTS: {
    ROOT: '/alerts',
    RECENT: '/alerts/recent',
    BY_RECIPIENT: (recipientId: number) => `/alerts/recipient/${recipientId}`,
    UNREAD: (recipientId: number) => `/alerts/recipient/${recipientId}/unread`,
    CRITICAL: (recipientId: number) => `/alerts/recipient/${recipientId}/critical`,
    UNREAD_COUNT: (recipientId: number) => `/alerts/recipient/${recipientId}/unread-count`,
    MARK_READ: (id: number) => `/alerts/${id}/read`,
    MARK_ALL_READ: (recipientId: number) => `/alerts/recipient/${recipientId}/read-all`,
    ACKNOWLEDGE: (id: number) => `/alerts/${id}/acknowledge`,
  },
  REPORTS: {
    LATEST_SNAPSHOT: '/reports/snapshot/latest',
    LOW_STOCK: '/reports/low-stock',
    DEAD_STOCK: '/reports/dead-stock',
    TOP_MOVING: '/reports/top-moving',
    SLOW_MOVING: '/reports/slow-moving',
    TOTAL_VALUATION: '/reports/valuation/total',
    WAREHOUSE_VALUATION: (warehouseId: number) => `/reports/valuation/warehouse/${warehouseId}`,
    TURNOVER: '/reports/turnover',
    PO_SUMMARY: '/reports/po-summary',
    MOVEMENT_SUMMARY: '/reports/movement-summary',
    EXPORT: '/reports/export',
  },
  PAYMENTS: {
    ROOT: '/payments',
    CREATE_ORDER: '/payments/create-order',
    VERIFY: '/payments/verify',
    BY_ORDER: (orderId: string) => `/payments/order/${orderId}`,
    BY_PURCHASE_ORDER: (poId: number) => `/payments/purchase-order/${poId}`,
    BY_USER: (userId: number) => `/payments/user/${userId}`,
    BY_STATUS: (status: string) => `/payments/status/${status}`,
  },
} as const;

export const UI_CONSTANTS = {
  DEBOUNCE_DELAY: 400,
  TOAST_DURATION: 3000,
  API_TIMEOUT: 30000,
  DEFAULT_REPORT_DAYS: 30,
} as const;
