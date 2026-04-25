# StockPro Thymeleaf UI Contract

This repo did not contain a Spring MVC or Thymeleaf view layer, so the UI has been added under:

- `src/main/resources/templates`
- `src/main/resources/static/css/stockpro-ui.css`
- `src/main/resources/static/js/stockpro-ui.js`

## View names

Use these controller return values:

- `dashboard/index`
- `inventory/products`
- `inventory/product-detail`
- `inventory/warehouses`
- `inventory/warehouse-detail`
- `inventory/stock`
- `inventory/transfer`
- `movement/index`
- `alert/index`
- `purchase/orders`
- `purchase/detail`
- `supplier/index`
- `report/dashboard`
- `report/low-stock`
- `report/top-moving`
- `report/dead-stock`
- `admin/dashboard`
- `admin/users`

## Shared model attributes

Provide these from a `@ControllerAdvice` or a shared base controller:

- `activeMenu`
  Values used by the sidebar: `dashboard`, `products`, `warehouses`, `stock`, `movements`, `purchaseOrders`, `suppliers`, `reportsDashboard`, `reportsLowStock`, `reportsTopMoving`, `reportsDeadStock`, `alerts`, `adminDashboard`, `users`
- `currentUser`
  Expected fields: `fullName`, `initials`, `roleLabel`, `email`
- `alertSummary`
  Expected fields:
  - `unreadCount`
  - `recentAlerts`
  Each recent alert should expose:
  - `title`
  - `message`
  - `severity`
  - `read`
  - `linkUrl`
  - `markReadUrl`
  - `createdAtLabel`
- Flash message fields when applicable:
  - `successMessage`
  - `warningMessage`
  - `errorMessage`
  - `infoMessage`

## Security expectations

Templates use `sec:authorize`, so the Spring app should include the Thymeleaf Spring Security dialect.

Recommended dependency for Spring Boot 3 / Spring Security 6:

`org.thymeleaf.extras:thymeleaf-extras-springsecurity6`

## Pagination helper

The reusable pagination fragment expects a helper object like `productsPager`, `ordersPager`, `usersPager`, and so on.

Expected shape:

- `currentPage`
- `totalPages`
- `totalElements`
- `rangeStart`
- `rangeEnd`
- `firstUrl`
- `prevUrl`
- `nextUrl`
- `lastUrl`
- `pages`

Each `pages` item should expose:

- `label`
- `url`
- `active`

## Page-specific model attributes

### Dashboard

- `dashboard`
  Suggested fields:
  - `totalStockValue`
  - `lowStockCount`
  - `deadStockCount`
  - `totalPoSpend`
  - `snapshotLabel`
  - `criticalAlertCount`
  - `pendingTransfers`
  - `pendingApprovals`
  - `recentMovements`
  - `lowStockPreview`

### Inventory

- `productsPage`, `productsPager`, `productCategories`, `productFilter`
- `product`
- `warehouses`
- `warehouse`, `warehouseStockPage`, `warehouseStockPager`
- `stockPage`, `stockPager`, `stockFilter`, `products`, `warehouses`
- `transferForm`, `products`, `warehouses`

### Movements

- `movementPage`, `movementPager`, `movementFilter`, `products`, `warehouses`, `movementTypes`

### Alerts

- `alertsPage`, `alertsPager`, `alertFilter`

Each alert row should support:

- `id`
- `title`
- `message`
- `severity`
- `source`
- `read`
- `acknowledged`
- `createdAt`
- `linkUrl`

### Purchase

- `ordersPage`, `ordersPager`, `orderFilter`, `suppliers`, `purchaseStatuses`
- `purchaseOrder`

`purchaseOrder.lineItems` should expose:

- `productName`
- `sku`
- `orderedQuantity`
- `receivedQuantity`
- `remainingQuantity`
- `unitCost`
- `totalCost`

### Suppliers

- `suppliersPage`, `suppliersPager`, `supplierFilter`

### Reports

- `reportSummary`
- `lowStockPage`, `lowStockPager`, `lowStockFilter`, `products`, `warehouses`
- `topMovingPage`, `topMovingPager`, `topMovingFilter`
- `deadStockPage`, `deadStockPager`, `deadStockFilter`, `products`, `warehouses`

### Admin

- `adminOverview`
- `serviceHealth`
- `usersPage`, `usersPager`, `userFilter`, `roles`

## Form validation

`inventory/transfer.html` is wired for Spring form binding and backend validation via:

- `th:object`
- `th:field`
- `#fields.hasErrors(...)`
- `#fields.globalErrors()`

Use `BindingResult` with the same model attribute name (`transferForm`) for validation feedback.
