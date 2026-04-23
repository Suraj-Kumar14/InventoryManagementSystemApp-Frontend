import { Routes } from "@angular/router";
import { authGuard, guestChildGuard, guestGuard } from "./core/guards/auth.guard";
import { roleGuard } from "./core/guards/role.guard";

const loadAuthLayout = () =>
  import("./core/layout/auth-layout/auth-layout.component").then(
    (m) => m.AuthLayoutComponent,
  );

const loadShell = () =>
  import("./core/layout/shell/shell.component").then((m) => m.ShellComponent);

const loadOauthCallback = () =>
  import("./features/auth/oauth-callback/oauth-callback.component").then(
    (m) => m.OauthCallbackComponent,
  );

export const routes: Routes = [
  // Public auth routes
  {
    path: "auth",
    loadComponent: loadAuthLayout,
    canActivate: [guestGuard],
    canActivateChild: [guestChildGuard],
    children: [
      {
        path: "login",
        loadComponent: () =>
          import("./features/auth/login/login.component").then(
            (m) => m.LoginComponent,
          ),
      },
      {
        path: "register",
        loadComponent: () =>
          import("./features/auth/register/register.component").then(
            (m) => m.RegisterComponent,
          ),
      },
      {
        path: "verify-email-otp",
        loadComponent: () =>
          import("./features/auth/verify-email-otp/verify-email-otp.component").then(
            (m) => m.VerifyEmailOtpComponent,
          ),
      },
      {
        path: "forgot-password",
        loadComponent: () =>
          import("./features/auth/forgot-password/forgot-password.component").then(
            (m) => m.ForgotPasswordComponent,
          ),
      },
      {
        path: "verify-forgot-password-otp",
        loadComponent: () =>
          import("./features/auth/verify-forgot-password-otp/verify-forgot-password-otp.component").then(
            (m) => m.VerifyForgotPasswordOtpComponent,
          ),
      },
      {
        path: "reset-password",
        loadComponent: () =>
          import("./features/auth/reset-password/reset-password.component").then(
            (m) => m.ResetPasswordComponent,
          ),
      },
      {
        path: "",
        pathMatch: "full",
        redirectTo: "login",
      },
    ],
  },

  // OAuth callback route
  {
    path: "oauth-callback",
    loadComponent: loadAuthLayout,
    children: [
      {
        path: "",
        loadComponent: loadOauthCallback,
      },
    ],
  },

  // Authenticated app
  {
    path: "",
    loadComponent: loadShell,
    canActivate: [authGuard],
    children: [
      {
        path: "dashboard",
        loadComponent: () =>
          import("./features/dashboard/dashboard.component").then(
            (m) => m.DashboardComponent,
          ),
      },

      // Products
      {
        path: "products",
        canActivate: [roleGuard],
        data: {
          roles: [
            "ADMIN",
            "INVENTORY_MANAGER",
            "WAREHOUSE_STAFF",
            "PURCHASE_OFFICER",
          ],
        },
        children: [
          {
            path: "",
            loadComponent: () =>
              import("./features/products/product-list/product-list.component").then(
                (m) => m.ProductListComponent,
              ),
          },
          {
            path: "low-stock",
            loadComponent: () =>
              import("./features/products/product-low-stock/product-low-stock.component").then(
                (m) => m.ProductLowStockComponent,
              ),
          },
          {
            path: "scan",
            loadComponent: () =>
              import("./features/products/product-scan/product-scan.component").then(
                (m) => m.ProductScanComponent,
              ),
          },
          {
            path: "new",
            canActivate: [roleGuard],
            data: { roles: ["MANAGER", "INVENTORY_MANAGER"] },
            loadComponent: () =>
              import("./features/products/product-form/product-form.component").then(
                (m) => m.ProductFormComponent,
              ),
          },
          {
            path: ":id/edit",
            canActivate: [roleGuard],
            data: { roles: ["MANAGER", "INVENTORY_MANAGER"] },
            loadComponent: () =>
              import("./features/products/product-form/product-form.component").then(
                (m) => m.ProductFormComponent,
              ),
          },
          {
            path: ":id",
            loadComponent: () =>
              import("./features/products/product-detail/product-detail.component").then(
                (m) => m.ProductDetailComponent,
              ),
          },
        ],
      },

      // Warehouses
      {
        path: "warehouses",
        canActivate: [roleGuard],
        data: { roles: ["ADMIN", "INVENTORY_MANAGER"] },
        children: [
          {
            path: "",
            loadComponent: () =>
              import("./features/warehouses/warehouse-list/warehouse-list.component").then(
                (m) => m.WarehouseListComponent,
              ),
          },
          {
            path: "new",
            loadComponent: () =>
              import("./features/warehouses/warehouse-form/warehouse-form.component").then(
                (m) => m.WarehouseFormComponent,
              ),
          },
          {
            path: ":id/edit",
            loadComponent: () =>
              import("./features/warehouses/warehouse-form/warehouse-form.component").then(
                (m) => m.WarehouseFormComponent,
              ),
          },
        ],
      },

      // Stock
      {
        path: "stock",
        canActivate: [roleGuard],
        data: { roles: ["ADMIN", "INVENTORY_MANAGER", "WAREHOUSE_STAFF"] },
        children: [
          {
            path: "",
            loadComponent: () =>
              import("./features/stock/stock-list/stock-list.component").then(
                (m) => m.StockListComponent,
              ),
          },
          {
            path: "transfer",
            loadComponent: () =>
              import("./features/stock/stock-transfer/stock-transfer.component").then(
                (m) => m.StockTransferComponent,
              ),
          },
          {
            path: "adjust",
            loadComponent: () =>
              import("./features/stock/stock-adjust/stock-adjust.component").then(
                (m) => m.StockAdjustComponent,
              ),
          },
          {
            path: "barcode",
            loadComponent: () =>
              import("./features/stock/barcode-lookup/barcode-lookup.component").then(
                (m) => m.BarcodeLookupComponent,
              ),
          },
        ],
      },

      // Purchase Orders
      {
        path: "purchase-orders",
        canActivate: [roleGuard],
        data: { roles: ["ADMIN", "PURCHASE_OFFICER", "INVENTORY_MANAGER"] },
        children: [
          {
            path: "",
            loadComponent: () =>
              import("./features/purchase-orders/po-list/po-list.component").then(
                (m) => m.PoListComponent,
              ),
          },
          {
            path: "new",
            loadComponent: () =>
              import("./features/purchase-orders/po-form/po-form.component").then(
                (m) => m.PoFormComponent,
              ),
          },
          {
            path: ":id",
            loadComponent: () =>
              import("./features/purchase-orders/po-detail/po-detail.component").then(
                (m) => m.PoDetailComponent,
              ),
          },
          {
            path: ":id/edit",
            loadComponent: () =>
              import("./features/purchase-orders/po-form/po-form.component").then(
                (m) => m.PoFormComponent,
              ),
          },
          {
            path: ":id/receive",
            loadComponent: () =>
              import("./features/purchase-orders/receive-goods/receive-goods.component").then(
                (m) => m.ReceiveGoodsComponent,
              ),
          },
        ],
      },

      // Suppliers
      {
        path: "suppliers",
        canActivate: [roleGuard],
        data: { roles: ["ADMIN", "PURCHASE_OFFICER"] },
        children: [
          {
            path: "",
            loadComponent: () =>
              import("./features/suppliers/supplier-list/supplier-list.component").then(
                (m) => m.SupplierListComponent,
              ),
          },
          {
            path: "new",
            loadComponent: () =>
              import("./features/suppliers/supplier-form/supplier-form.component").then(
                (m) => m.SupplierFormComponent,
              ),
          },
          {
            path: ":id/edit",
            loadComponent: () =>
              import("./features/suppliers/supplier-form/supplier-form.component").then(
                (m) => m.SupplierFormComponent,
              ),
          },
        ],
      },

      {
        path: "movements",
        canActivate: [roleGuard],
        data: { roles: ["ADMIN", "INVENTORY_MANAGER", "WAREHOUSE_STAFF"] },
        loadComponent: () =>
          import("./features/movements/movement-list/movement-list.component").then(
            (m) => m.MovementListComponent,
          ),
      },

      {
        path: "alerts",
        loadComponent: () =>
          import("./features/alerts/alert-center/alert-center.component").then(
            (m) => m.AlertCenterComponent,
          ),
      },

      {
        path: "reports",
        canActivate: [roleGuard],
        data: { roles: ["ADMIN", "INVENTORY_MANAGER", "PURCHASE_OFFICER"] },
        loadComponent: () =>
          import("./features/reports/reports/reports.component").then(
            (m) => m.ReportsComponent,
          ),
      },

      {
        path: "admin",
        canActivate: [roleGuard],
        data: { roles: ["ADMIN"] },
        loadComponent: () =>
          import("./features/admin/admin/admin.component").then(
            (m) => m.AdminComponent,
          ),
      },

      {
        path: "profile",
        loadComponent: () =>
          import("./features/profile/profile/profile.component").then(
            (m) => m.ProfileComponent,
          ),
      },

      {
        path: "",
        pathMatch: "full",
        redirectTo: "dashboard",
      },
    ],
  },

  // final fallback
  {
    path: "**",
    redirectTo: "auth/login",
  },
];
