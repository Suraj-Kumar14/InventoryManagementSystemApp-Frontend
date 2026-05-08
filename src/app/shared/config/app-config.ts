export enum UserRole {
  ADMIN = 'ADMIN',
  INVENTORY_MANAGER = 'MANAGER',
  MANAGER = 'MANAGER',
  PURCHASE_OFFICER = 'OFFICER',
  OFFICER = 'OFFICER',
  WAREHOUSE_STAFF = 'STAFF',
  STAFF = 'STAFF',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrator',
  [UserRole.INVENTORY_MANAGER]: 'Inventory Manager',
  [UserRole.PURCHASE_OFFICER]: 'Purchase Officer',
  [UserRole.WAREHOUSE_STAFF]: 'Warehouse Staff',
};

export const ROLE_PAGES: Record<UserRole, string> = {
  [UserRole.ADMIN]: '/dashboard/admin',
  [UserRole.INVENTORY_MANAGER]: '/dashboard/manager',
  [UserRole.PURCHASE_OFFICER]: '/dashboard/officer',
  [UserRole.WAREHOUSE_STAFF]: '/dashboard/staff',
};

export const ROLE_REGISTRATION_ALLOWED: UserRole[] = [
  UserRole.INVENTORY_MANAGER,
  UserRole.PURCHASE_OFFICER,
  UserRole.WAREHOUSE_STAFF,
];

export function normalizeUserRole(role: string | null | undefined): UserRole | null {
  const normalizedRole = role?.replace(/^ROLE_/, '').trim().toUpperCase();

  switch (normalizedRole) {
    case UserRole.ADMIN:
      return UserRole.ADMIN;
    case 'INVENTORY_MANAGER':
    case UserRole.MANAGER:
      return UserRole.INVENTORY_MANAGER;
    case 'PURCHASE_OFFICER':
    case UserRole.OFFICER:
      return UserRole.PURCHASE_OFFICER;
    case 'WAREHOUSE_STAFF':
    case UserRole.STAFF:
      return UserRole.WAREHOUSE_STAFF;
    default:
      return null;
  }
}

export function toBackendUserRole(role: UserRole): 'ADMIN' | 'MANAGER' | 'OFFICER' | 'STAFF' {
  if (role === UserRole.ADMIN) {
    return 'ADMIN';
  }

  if (role === UserRole.INVENTORY_MANAGER) {
    return 'MANAGER';
  }

  if (role === UserRole.PURCHASE_OFFICER) {
    return 'OFFICER';
  }

  return 'STAFF';
}

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
    USER_SUMMARY: '/auth/users/summary',
    USER_DETAIL: (id: number) => `/auth/users/${id}`,
    DEACTIVATE_USER: (id: number) => `/auth/users/${id}/deactivate`,
    ACTIVATE_USER: (id: number) => `/auth/users/${id}/activate`,
    ADMIN_USERS: '/auth/users',
    ADMIN_USER_SUMMARY: '/auth/users/summary',
    ADMIN_USER_DETAIL: (id: number) => `/auth/users/${id}`,
    ADMIN_USER_UPDATE: (id: number) => `/auth/users/${id}`,
    ADMIN_USER_ROLE: (id: number) => `/auth/users/${id}/role`,
    ADMIN_USER_DEACTIVATE: (id: number) => `/auth/users/${id}/deactivate`,
    ADMIN_USER_ACTIVATE: (id: number) => `/auth/users/${id}/activate`,
    GOOGLE_LOGIN: '/oauth2/authorization/google',
  },
  PRODUCTS: {
    ROOT: '/api/v1/products',
    ACTIVE: '/api/v1/products/search?isActive=true',
    SEARCH: '/api/v1/products/search',
    SUMMARY: '/api/v1/products/summary',
    CATEGORIES: '/api/v1/products/categories',
    BRANDS: '/api/v1/products/brands',
    DETAIL: (id: number) => `/api/v1/products/${id}`,
    SKU: (sku: string) => `/api/v1/products/sku/${sku}`,
    BARCODE: (barcode: string) => `/api/v1/products/barcode/${barcode}`,
    CATEGORY: (category: string) => `/api/v1/products/category/${category}`,
    BRAND: (brand: string) => `/api/v1/products/brand/${brand}`,
    DEACTIVATE: (id: number) => `/api/v1/products/${id}/deactivate`,
    ACTIVATE: (id: number) => `/api/v1/products/${id}/activate`,
  },
  SUPPLIERS: {
    ROOT: '/api/v1/suppliers',
    ACTIVE: '/api/v1/suppliers/active',
    SEARCH: '/api/v1/suppliers/search',
    SUMMARY: '/api/v1/suppliers/summary',
    TOP_RATED: '/api/v1/suppliers/top-rated',
    DETAIL: (id: number) => `/api/v1/suppliers/${id}`,
    CODE: (supplierCode: string) => `/api/v1/suppliers/code/${supplierCode}`,
    EMAIL: (email: string) => `/api/v1/suppliers/email/${email}`,
    ACTIVATE: (id: number) => `/api/v1/suppliers/${id}/activate`,
    DEACTIVATE: (id: number) => `/api/v1/suppliers/${id}/deactivate`,
    BLACKLIST: (id: number) => `/api/v1/suppliers/${id}/blacklist`,
    RATING: (id: number) => `/api/v1/suppliers/${id}/rating`,
    PERFORMANCE: (id: number) => `/api/v1/suppliers/${id}/performance`,
    VALIDATE_FOR_PURCHASE: (id: number) => `/api/v1/suppliers/${id}/validate-for-purchase`,
  },
  WAREHOUSES: {
    ROOT: '/api/v1/warehouses',
    SUMMARY: '/api/v1/warehouses/summary',
    CODE: (code: string) => `/api/v1/warehouses/code/${code}`,
    MANAGER: (managerId: number) => `/api/v1/warehouses/manager/${managerId}`,
    DEACTIVATE: (id: number) => `/api/v1/warehouses/${id}/deactivate`,
    ACTIVATE: (id: number) => `/api/v1/warehouses/${id}/activate`,
  },
  STOCK: {
    ROOT: '/api/v1/stocks',
    BY_WAREHOUSE: (warehouseId: number) => `/api/v1/stocks/warehouse/${warehouseId}`,
    BY_PRODUCT: (productId: number) => `/api/v1/stocks/product/${productId}`,
    BY_WAREHOUSE_AND_PRODUCT: (warehouseId: number, productId: number) =>
      `/api/v1/stocks/warehouse/${warehouseId}/product/${productId}`,
    UPDATE: '/api/v1/stocks/update',
    RECEIVE: '/api/v1/stocks/receive',
    ISSUE: '/api/v1/stocks/issue',
    RESERVE: '/api/v1/stocks/reserve',
    RELEASE: '/api/v1/stocks/release',
    TRANSFER: '/api/v1/stocks/transfer',
    ADJUST: '/api/v1/stocks/adjust',
    LOW_STOCK: '/api/v1/stocks/low-stock',
    OVERSTOCK: '/api/v1/stocks/overstock',
    SUMMARY: '/api/v1/stocks/summary',
    MOVEMENTS: '/stock/movements',
    AUDIT: '/stock/audit',
    BARCODE: (barcode: string) => `/stock/barcode/${barcode}`,
    ALERTS: '/stock/alerts',
    ACKNOWLEDGE_ALERT: (alertId: number) => `/stock/alerts/${alertId}/acknowledge`,
  },
  PURCHASE_ORDERS: {
    ROOT: '/api/v1/purchase-orders',
    SEARCH: '/api/v1/purchase-orders/search',
    SUMMARY: '/api/v1/purchase-orders/summary',
    ANALYTICS: '/api/v1/purchase-orders/analytics',
    OVERDUE: '/api/v1/purchase-orders/overdue',
    PENDING_APPROVAL: '/api/v1/purchase-orders/pending-approval',
    DETAIL: (id: number) => `/api/v1/purchase-orders/${id}`,
    NUMBER: (poNumber: string) => `/api/v1/purchase-orders/number/${poNumber}`,
    BY_SUPPLIER: (supplierId: number) => `/api/v1/purchase-orders/supplier/${supplierId}`,
    BY_WAREHOUSE: (warehouseId: number) => `/api/v1/purchase-orders/warehouse/${warehouseId}`,
    BY_STATUS: (status: string) => `/api/v1/purchase-orders/status/${status}`,
    BY_CREATED_BY: (userId: number) => `/api/v1/purchase-orders/created-by/${userId}`,
    DATE_RANGE: '/api/v1/purchase-orders/date-range',
    SUBMIT: (id: number) => `/api/v1/purchase-orders/${id}/submit`,
    APPROVE: (id: number) => `/api/v1/purchase-orders/${id}/approve`,
    REJECT: (id: number) => `/api/v1/purchase-orders/${id}/reject`,
    CANCEL: (id: number) => `/api/v1/purchase-orders/${id}/cancel`,
    RECEIVE: (id: number) => `/api/v1/purchase-orders/${id}/receive`,
    RECEIVE_GOODS: (id: number) => `/api/v1/purchase-orders/${id}/receive`,
    HISTORY: (id: number) => `/api/v1/purchase-orders/${id}/history`,
  },
  MOVEMENTS: {
    ROOT: '/api/v1/movements',
    SEARCH: '/api/v1/movements/search',
    SUMMARY: '/api/v1/movements/summary',
    ANALYTICS: '/api/v1/movements/analytics',
    EXPORT_CSV: '/api/v1/movements/export/csv',
    DETAIL: (id: number) => `/api/v1/movements/${id}`,
    NUMBER: (movementNumber: string) => `/api/v1/movements/number/${movementNumber}`,
    BY_PRODUCT: (productId: number) => `/api/v1/movements/product/${productId}`,
    BY_WAREHOUSE: (warehouseId: number) => `/api/v1/movements/warehouse/${warehouseId}`,
    BY_REFERENCE: (referenceType: string, referenceId: string) =>
      `/api/v1/movements/reference?referenceType=${referenceType}&referenceId=${referenceId}`,
    BY_USER: (userId: number) => `/api/v1/movements/user/${userId}`,
    REVERSE: (id: number) => `/api/v1/movements/${id}/reverse`,
  },
  ALERTS: {
    ROOT: '/api/v1/alerts',
    MY: '/api/v1/alerts/my',
    SEARCH: '/api/v1/alerts/search',
    BROADCAST: '/api/v1/alerts/broadcast',
    UNREAD_COUNT: '/api/v1/alerts/unread-count',
    MY_SUMMARY: '/api/v1/alerts/summary/my',
    SYSTEM_SUMMARY: '/api/v1/alerts/summary/system',
    ANALYTICS: '/api/v1/alerts/analytics',
    DETAIL: (id: number) => `/api/v1/alerts/${id}`,
    NUMBER: (alertNumber: string) => `/api/v1/alerts/number/${alertNumber}`,
    MARK_READ: (id: number) => `/api/v1/alerts/${id}/read`,
    MARK_ALL_READ: '/api/v1/alerts/read-all',
    ACKNOWLEDGE: (id: number) => `/api/v1/alerts/${id}/acknowledge`,
    DISMISS: (id: number) => `/api/v1/alerts/${id}/dismiss`,
    RESOLVE: (id: number) => `/api/v1/alerts/${id}/resolve`,
  },
  REPORTS: {
    ROOT: '/api/v1/reports',
    INVENTORY_VALUATION: '/api/v1/reports/inventory/valuation',
    STOCK_SUMMARY: '/api/v1/reports/inventory/stock-summary',
    PRODUCT_STOCK: '/api/v1/reports/inventory/product-stock',
    WAREHOUSE_STOCK: '/api/v1/reports/inventory/warehouse-stock',
    LOW_STOCK: '/api/v1/reports/inventory/low-stock',
    OVERSTOCK: '/api/v1/reports/inventory/overstock',
    MOVEMENTS: '/api/v1/reports/movements',
    TURNOVER: '/api/v1/reports/movements/turnover',
    TOP_MOVING: '/api/v1/reports/movements/top-moving-products',
    SLOW_MOVING: '/api/v1/reports/movements/slow-moving-products',
    DEAD_STOCK: '/api/v1/reports/movements/dead-stock',
    PURCHASE_SUMMARY: '/api/v1/reports/purchase/summary',
    SUPPLIER_PERFORMANCE: '/api/v1/reports/purchase/supplier-performance',
    SUPPLIER_PERFORMANCE_BY_ID: (supplierId: number) =>
      `/api/v1/reports/purchase/supplier-performance/${supplierId}`,
    ALERT_SUMMARY: '/api/v1/reports/alerts/summary',
    EXECUTIVE_DASHBOARD: '/api/v1/reports/dashboard/executive',
    MY_DASHBOARD: '/api/v1/reports/dashboard/my',
    SNAPSHOT_RUN: '/api/v1/reports/snapshots/run',
    SNAPSHOTS: '/api/v1/reports/snapshots',
    SNAPSHOT_TREND: '/api/v1/reports/snapshots/trend',
    EXPORT_INVENTORY_VALUATION: '/api/v1/reports/export/inventory-valuation',
    EXPORT_STOCK_MOVEMENTS: '/api/v1/reports/export/stock-movements',
    EXPORT_PURCHASE_SUMMARY: '/api/v1/reports/export/purchase-summary',
    EXPORT_SUPPLIER_PERFORMANCE: '/api/v1/reports/export/supplier-performance',
    EXPORT_EXECUTIVE_DASHBOARD: '/api/v1/reports/export/executive-dashboard',
  },
  PAYMENTS: {
    ROOT: '/api/v1/payments',
    DETAIL: (id: number) => `/api/v1/payments/${id}`,
    BY_PURCHASE_ORDER: (poId: number) => `/api/v1/payments/purchase-order/${poId}`,
    PAID_AMOUNT: (poId: number) => `/api/v1/payments/purchase-order/${poId}/paid-amount`,
    REMAINING_AMOUNT: (poId: number) => `/api/v1/payments/purchase-order/${poId}/remaining-amount`,
    RAZORPAY_INITIATE: '/api/v1/payments/razorpay/initiate',
    RAZORPAY_VERIFY: '/api/v1/payments/razorpay/verify',
  },
} as const;

export const UI_CONSTANTS = {
  DEBOUNCE_DELAY: 400,
  TOAST_DURATION: 3000,
  API_TIMEOUT: 30000,
  DEFAULT_REPORT_DAYS: 30,
} as const;

/** Indian mobile number: starts with 6-9, followed by 9 digits */
export const INDIAN_PHONE_REGEX = /^[6-9][0-9]{9}$/;
