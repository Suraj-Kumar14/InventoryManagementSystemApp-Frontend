# StockPro Frontend Architecture Documentation

## 🎯 Overview

StockPro Frontend is a **premium, production-grade Angular SaaS application** built with Angular 21, TailwindCSS, and follows enterprise-level architecture best practices.

### Key Features
- ✅ JWT-based authentication with role-based access control (RBAC)
- ✅ Premium responsive UI/UX (mobile-first design)
- ✅ 4 role-based dashboard layouts (Admin, Inventory Manager, Purchase Officer, Warehouse Staff)
- ✅ Anti-double-click mechanism to prevent duplicate API calls
- ✅ Global error handling & notifications
- ✅ Lazy-loaded feature modules for optimal performance
- ✅ Clean, modular, and scalable architecture

---

## 📁 Project Structure

```
src/app/
├── core/                          # Singleton services, guards, interceptors
│   ├── auth/
│   │   ├── models/
│   │   │   └── auth.models.ts          # Auth interfaces
│   │   └── services/
│   │       ├── auth.service.ts         # Authentication logic
│   │       └── token.service.ts        # JWT token management
│   ├── guards/
│   │   ├── auth.guard.ts               # Authenticated access guard
│   │   └── role.guard.ts               # Role-based access guard
│   ├── interceptors/
│   │   ├── jwt.interceptor.ts          # JWT token injection
│   │   └── error.interceptor.ts        # Global error handling
│   └── services/
│       └── notification.service.ts     # Toast notifications
│
├── shared/                        # Reusable components, pipes, directives
│   ├── components/
│   │   ├── navbar/                     # Top navigation bar
│   │   ├── sidebar/                    # Left sidebar with menu
│   │   ├── button/                     # Reusable button component
│   │   ├── loading-spinner/            # Loading indicator
│   │   ├── skeleton-loader/            # Skeleton loading placeholders
│   │   └── layout/                     # Main app layout wrapper
│   ├── config/
│   │   └── app-config.ts               # App configuration & constants
│   ├── directives/
│   │   └── debounce-click.directive.ts # Anti-double-click directive
│   └── models/
│       └── common.models.ts            # Common types
│
├── features/                      # Feature modules (lazy-loaded)
│   ├── auth/
│   │   ├── pages/
│   │   │   ├── login/                  # Login page
│   │   │   ├── register/               # Registration page
│   │   │   └── unauthorized/           # 403 error page
│   │   └── auth.routes.ts
│   ├── dashboard/
│   │   ├── pages/
│   │   │   ├── admin-dashboard/        # Admin dashboard
│   │   │   ├── inventory-dashboard/    # Inventory manager dashboard
│   │   │   ├── purchase-dashboard/     # Purchase officer dashboard
│   │   │   └── warehouse-dashboard/    # Warehouse staff dashboard
│   │   └── dashboard.routes.ts
│   ├── settings/
│   │   ├── pages/
│   │   │   └── settings/               # User profile & preferences
│   │   └── settings.routes.ts
│   ├── admin/                          # Admin feature module
│   ├── inventory/                      # Inventory feature module
│   ├── purchase/                       # Purchase feature module
│   ├── warehouse/                      # Warehouse feature module
│   └── reports/                        # Reports feature module
│
├── environments/
│   ├── environment.ts                  # Development environment config
│   └── environment.prod.ts             # Production environment config
│
├── app.routes.ts                  # Main application routing
├── app.config.ts                  # Application providers & interceptors
├── app.ts                         # Root app component
└── app.html                       # Root app template

styles.css                         # Global styles with Tailwind
index.html                         # HTML entry point
main.ts                            # Angular bootstrap entry point
```

---

## 🔐 Authentication Flow

### 1. **User Registration** (`/register`)
```
User fills form (name, email, password, role) 
  → Register API call 
  → JWT token received 
  → Token stored in sessionStorage 
  → Auto-redirect to login
```

### 2. **User Login** (`/login`)
```
User enters credentials 
  → Login API call 
  → JWT token received 
  → Token stored in sessionStorage 
  → Role detected from JWT 
  → Redirect to role-based dashboard
```

### 3. **Token Management**
- **Storage**: `sessionStorage` (auto-clears on browser close - more secure)
- **JWT Validation**: Token decoded to extract `sub` (user ID), `email`, `name`, `role`, `permissions`
- **Token Refresh**: On 401 response, JWT interceptor handles refresh
- **Expiration**: Tokens considered expired 60 seconds before actual expiration

### 4. **Logout**
```
User clicks logout 
  → Token cleared from sessionStorage 
  → Authentication state reset 
  → Redirect to /login
```

---

## 🛡️ Route Protection

### Auth Guard
Protects all authenticated routes. Redirects to `/login` if not authenticated.

```typescript
// Usage in routes
{
  path: 'dashboard',
  canActivate: [authGuard],
  children: [...]
}
```

### Role Guard
Restricts routes based on user role. Redirects to `/unauthorized` if role doesn't match.

```typescript
// Usage in routes
{
  path: 'admin',
  canActivate: [roleGuard],
  data: { roles: [UserRole.ADMIN] },
  children: [...]
}
```

### Route Structure
```
/login                  → Public (no auth required)
/register               → Public (no auth required)
/unauthorized           → Public (for 403 errors)

/dashboard/admin        → ADMIN only
/dashboard/inventory    → INVENTORY_MANAGER only
/dashboard/purchase     → PURCHASE_OFFICER only
/dashboard/warehouse    → WAREHOUSE_STAFF only

/admin/**               → ADMIN only
/inventory/**           → INVENTORY_MANAGER only
/purchase/**            → PURCHASE_OFFICER only
/warehouse/**           → WAREHOUSE_STAFF only
/settings/**            → All authenticated users
/reports/**             → ADMIN, INVENTORY_MANAGER only
```

---

## 🌐 HTTP Interceptors

### JWT Interceptor (`JwtInterceptor`)
**Responsibility**: Inject JWT token into all API requests (except public endpoints)

```typescript
// Adds to every request:
Authorization: Bearer <JWT_TOKEN>

// Public endpoints (no token added):
- /auth/login
- /auth/register
- /auth/refresh
```

### Error Interceptor (`ErrorInterceptor`)
**Responsibility**: Handle HTTP errors globally

| Status | Action |
|--------|--------|
| 401 | Logout & redirect to /login |
| 403 | Redirect to /unauthorized |
| 400 | Show validation error toast |
| 404 | Show "not found" toast |
| 500+ | Show "server error" toast |

---

## 🎨 UI Components

### Button Component (`ButtonComponent`)
- Supports 4 variants: primary, secondary, danger, success
- Built-in loading spinner
- Disabled state while loading
- Anti-double-click protection

```html
<app-button 
  [label]="'Save'" 
  [variant]="'primary'"
  [isLoading]="isLoading"
  (clicked)="onSave()"
></app-button>
```

### Loading Spinner (`LoadingSpinnerComponent`)
- Full-page overlay or inline spinner
- Customizable message

```html
<app-loading-spinner 
  [fullPage]="true" 
  [message]="'Loading...'"
></app-loading-spinner>
```

### Skeleton Loader (`SkeletonLoaderComponent`)
- Animated placeholder for tables/cards
- Configurable rows and columns

```html
<app-skeleton-loader 
  [rows]="5" 
  [cols]="3"
></app-skeleton-loader>
```

### Navbar (`NavbarComponent`)
- Displays logged-in user info
- User dropdown menu
- Mobile hamburger button
- Auto-logout functionality

### Sidebar (`SidebarComponent`)
- Role-based menu items
- Active link highlighting
- Collapsible on mobile
- Icon + label navigation

### Layout (`LayoutComponent`)
- Wrapper for authenticated routes
- Combines Navbar + Sidebar + Router Outlet
- Main container for all app pages

---

## 📊 Role-Based Dashboards

### Admin Dashboard
**Metrics**: Total users, warehouses, system stock value, audit logs
**Features**: Platform health monitoring, user management links, activity log

### Inventory Manager Dashboard
**Metrics**: Total inventory value, low stock alerts, top moving products, turnover rate
**Features**: Dead stock analysis, warehouse distribution, recent movements

### Purchase Officer Dashboard
**Metrics**: Pending POs, approved POs, total spend, overdue POs
**Features**: Supplier performance, PO status summary, recent purchase orders

### Warehouse Staff Dashboard
**Metrics**: Items in/out (today), pending tasks, active alerts
**Features**: Warehouse capacity by zone, task checklist, recent movements

---

## 🚀 Anti-Double-Click Mechanism

### Problem
Multiple clicks on a button can trigger duplicate API calls.

### Solution
The `DebounceClickDirective` debounces clicks for 400ms:

```typescript
@Directive({
  selector: '[appDebounceClick]'
})
export class DebounceClickDirective {
  @Output() debounceClick = new EventEmitter<MouseEvent>();
  
  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    // Only emit click after 400ms debounce
  }
}
```

### Implementation in Button Component
```html
<button (click)="onClick()" [disabled]="isLoading">
  <span *ngIf="isLoading">Loading...</span>
  {{ label }}
</button>
```

**Key Behaviors**:
1. Button disabled immediately on first click
2. Loading spinner shown
3. All clicks ignored until API response
4. Button re-enabled after response (success or error)

---

## 🔔 Notification System

### Toast Notifications
All API responses trigger automatic notifications via `NotificationService`:

```typescript
// Success notification
this.notification.success('Operation completed!');

// Error notification
this.notification.error('Something went wrong');

// Warning notification
this.notification.warning('Are you sure?');

// Info notification
this.notification.info('Please note...');
```

**Configuration**:
- Auto-dismiss after 3-5 seconds
- Bottom-right position
- Progress bar animation
- Prevent duplicate notifications

---

## 🎨 Styling with TailwindCSS

### Color Palette
```
primary:   #0ea5e9  (Sky blue)     → Main actions
success:   #22c55e  (Emerald)      → Positive actions
warning:   #f59e0b  (Amber)        → Warnings
danger:    #ef4444  (Red)          → Destructive actions
neutral:   #6b7280  (Gray)         → Text & secondary
```

### Responsive Breakpoints
```
sm: 640px   (tablets)
md: 768px   (small laptops)
lg: 1024px  (laptops)
xl: 1280px  (desktops)
2xl: 1536px (large desktops)
```

### Custom Animations
```css
animate-spin      → Loading spinner
animate-pulse     → Skeleton loaders
animate-fadeIn    → Component entrance
animate-slideDown → Dropdown menus
```

---

## 📦 API Integration

### Service Pattern
All API calls go through services in `core/` or feature modules:

```typescript
// AuthService example
login(credentials: LoginRequest): Observable<AuthResponse> {
  return this.http.post('/auth/login', credentials);
}

// Register example
register(userData: RegisterRequest): Observable<AuthResponse> {
  return this.http.post('/auth/register', userData);
}
```

### Error Handling
```typescript
this.authService.login(creds).subscribe({
  next: (response) => {
    // Success - notification auto-shown
    this.router.navigate(['/dashboard']);
  },
  error: (error) => {
    // Error interceptor handles this
    // Toast notification shown automatically
  }
});
```

---

## 🚀 Performance Optimizations

### 1. **Lazy Loading**
Feature modules load on-demand:
```typescript
{
  path: 'admin',
  loadChildren: () => import('./features/admin/admin.routes')
}
```

### 2. **Change Detection Strategy**
Components use `OnPush` where applicable for faster rendering.

### 3. **TrackBy Functions**
Lists use `trackBy` to avoid unnecessary DOM updates:
```html
<div *ngFor="let item of items; trackBy: trackByFn">
```

### 4. **Production Build**
```bash
npm run build
# Creates optimized bundle in dist/stockpro-frontend/
# All files minified, tree-shaken, and bundled
```

---

## 🧪 Running the Application

### Development
```bash
npm install              # Install dependencies
npm start               # Run dev server on http://localhost:4200
```

### Production Build
```bash
npm run build           # Build optimized production bundle
# Output: dist/stockpro-frontend/
```

### Environment Configuration
**Development** (`environment.ts`):
```typescript
apiUrl: 'http://localhost:8080/api'
```

**Production** (`environment.prod.ts`):
```typescript
apiUrl: 'https://api.stockpro.com/api'
```

---

## 📚 Authentication Models

### User Roles
```typescript
enum UserRole {
  ADMIN = 'ADMIN',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
  PURCHASE_OFFICER = 'PURCHASE_OFFICER',
  WAREHOUSE_STAFF = 'WAREHOUSE_STAFF'
}
```

### Registration Allowed Roles
```typescript
// Admin can ONLY be created from backend
ROLE_REGISTRATION_ALLOWED = [
  INVENTORY_MANAGER,
  PURCHASE_OFFICER,
  WAREHOUSE_STAFF
]
```

### JWT Payload
```typescript
interface JwtPayload {
  sub: string;              // User ID
  email: string;
  name: string;
  role: UserRole;
  iat: number;             // Issued at
  exp: number;             // Expiration
  permissions?: string[];   // Additional permissions
}
```

---

## 🔧 Common Development Tasks

### Adding a New Page
1. Create component in `features/module/pages/new-page/`
2. Create `new-page.component.ts`, template, and styles
3. Add route to `features/module/module.routes.ts`
4. Import route in main `app.routes.ts`

### Adding a New Service
1. Create service in `core/services/` or `features/module/services/`
2. Use `@Injectable({ providedIn: 'root' })`
3. Inject with `constructor(private service: MyService) {}`

### Adding a New Guard
1. Create guard in `core/guards/`
2. Implement `CanActivateFn`
3. Add to route `canActivate: [myGuard]`

### Adding API Endpoints
1. Update constants in `shared/config/app-config.ts`
2. Add corresponding service method
3. Call from component and handle response

---

## 🐛 Debugging

### Browser DevTools
- Angular DevTools extension (Chrome/Firefox)
- Check localStorage/sessionStorage for JWT token
- Network tab to inspect API calls
- Console for any JavaScript errors

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Token expired or invalid - re-login |
| 403 Forbidden | User role doesn't match route - redirect to /unauthorized |
| CORS errors | Backend needs to allow frontend domain |
| Token not persisting | Check sessionStorage in DevTools |
| Login loop | Token refresh may be failing |

---

## 📋 Feature Checklist

- ✅ JWT Authentication (login, register, logout)
- ✅ Role-Based Access Control (4 roles)
- ✅ Token Management (storage, refresh, expiration)
- ✅ Route Guards (auth, role-based)
- ✅ HTTP Interceptors (JWT injection, error handling)
- ✅ Global Error Handling
- ✅ Toast Notifications
- ✅ Anti-double-click Protection
- ✅ Responsive UI (mobile, tablet, desktop)
- ✅ Premium SaaS Design
- ✅ Lazy-loaded Modules
- ✅ 4 Role-Based Dashboards
- ✅ Skeleton Loaders & Spinners
- ✅ Production Build Pipeline

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review Angular official docs (angular.dev)
3. Check TailwindCSS docs (tailwindcss.com)
4. Review backend API documentation

---

## 📄 License

Proprietary - StockPro 2024

---

**Built with ❤️ using Angular 21 + TailwindCSS | Premium SaaS Quality**

