import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../http/api.service';
import {
  AdminUserSummary,
  CreateAdminUserRequest,
  PageResponse,
  UpdateAdminUserRequest,
  UserProfile,
} from '../http/backend.models';
import { API_ENDPOINTS, UserRole, normalizeUserRole, toBackendUserRole } from '../../shared/config/app-config';

interface UserQuery {
  page?: number;
  size?: number;
  search?: string;
  role?: UserRole | 'ALL' | '';
  status?: 'ACTIVE' | 'INACTIVE' | 'ALL' | '';
}

type WrappedResponse<T> = T | { data?: T } | PageResponse<T>;
type UserRecord = Partial<UserProfile> & Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly api = inject(ApiService);

  getUsers(params: UserQuery = {}): Observable<PageResponse<UserProfile>> {
    return this.api
      .get<unknown>(API_ENDPOINTS.AUTH.USERS, {
        params: {
          page: params.page ?? 0,
          size: params.size ?? 50,
          search: params.search?.trim() || '',
          role: this.normalizeRoleFilter(params.role),
          status: this.normalizeStatusFilter(params.status),
        },
      })
      .pipe(map((response) => this.extractPage(response)));
  }

  getUserSummary(): Observable<AdminUserSummary> {
    return this.api
      .get<unknown>(API_ENDPOINTS.AUTH.USER_SUMMARY)
      .pipe(map((response) => this.extractSummary(response)));
  }

  getUserById(userId: number): Observable<UserProfile> {
    return this.api
      .get<unknown>(API_ENDPOINTS.AUTH.USER_DETAIL(userId))
      .pipe(map((response) => this.normalizeUser(this.extractUser(response))));
  }

  createUser(payload: CreateAdminUserRequest): Observable<UserProfile> {
    return this.api
      .post<unknown>(API_ENDPOINTS.AUTH.USERS, this.toBackendPayload(payload))
      .pipe(map((response) => this.normalizeUser(this.extractUser(response))));
  }

  updateUser(userId: number, payload: UpdateAdminUserRequest): Observable<UserProfile> {
    return this.api
      .put<unknown>(API_ENDPOINTS.AUTH.USER_DETAIL(userId), payload)
      .pipe(map((response) => this.normalizeUser(this.extractUser(response))));
  }

  changeUserRole(userId: number, role: UserRole): Observable<UserProfile> {
    return this.api
      .patch<unknown>(`${API_ENDPOINTS.AUTH.USER_DETAIL(userId)}/role`, {
        role: toBackendUserRole(role),
      })
      .pipe(map((response) => this.normalizeUser(this.extractUser(response))));
  }

  activateUser(userId: number): Observable<string> {
    return this.api.patch<string>(API_ENDPOINTS.AUTH.ACTIVATE_USER(userId), {}, { responseType: 'text' });
  }

  deactivateUser(userId: number): Observable<string> {
    return this.api.patch<string>(API_ENDPOINTS.AUTH.DEACTIVATE_USER(userId), {}, { responseType: 'text' });
  }

  private toBackendPayload(payload: CreateAdminUserRequest) {
    return {
      ...payload,
      role: toBackendUserRole(payload.role),
    };
  }

  private extractData<T>(response: WrappedResponse<T> | unknown): T | PageResponse<T> | undefined {
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as { data?: T | PageResponse<T> }).data;
    }

    return response as T | PageResponse<T>;
  }

  private extractSummary(response: unknown): AdminUserSummary {
    const data = this.extractData(response);
    if (data && !this.isPageResponse(data)) {
      return data as AdminUserSummary;
    }

    return this.emptySummary();
  }

  private extractUser(response: unknown): UserRecord {
    const data = this.extractData(response);
    if (data && !this.isPageResponse(data) && typeof data === 'object') {
      return data as UserRecord;
    }

    return {};
  }

  private extractPage(response: unknown): PageResponse<UserProfile> {
    const data = this.extractData(response);

    if (this.isPageResponse(data)) {
      return {
        ...data,
        content: data.content.map((user) => this.normalizeUser(user as UserRecord)),
      };
    }

    const list = Array.isArray(data) ? data.map((user) => this.normalizeUser(user as UserRecord)) : [];
    return {
      content: list,
      totalElements: list.length,
      totalPages: list.length ? 1 : 0,
      number: 0,
      size: list.length,
      numberOfElements: list.length,
      first: true,
      last: true,
      empty: list.length === 0,
    };
  }

  private isPageResponse<T>(value: unknown): value is PageResponse<T> {
    return !!value && typeof value === 'object' && 'content' in value;
  }

  private normalizeUser(user: UserRecord): UserProfile {
    const normalizedRole = normalizeUserRole(String(user.role ?? ''));

    return {
      userId: Number(user.userId ?? user['id']),
      name: String(user.name ?? user['fullName'] ?? ''),
      email: String(user.email ?? ''),
      phone: (user.phone as string | null | undefined) ?? null,
      role: normalizedRole ?? UserRole.STAFF,
      department: (user.department as string | null | undefined) ?? null,
      isActive: (user.isActive as boolean | undefined) ?? (user['active'] as boolean | undefined) ?? true,
      createdAt: (user.createdAt as string | undefined) ?? undefined,
      lastLoginAt:
        (user.lastLoginAt as string | null | undefined) ??
        (user['lastLogin'] as string | null | undefined) ??
        (user['lastLoginDate'] as string | null | undefined) ??
        null,
    };
  }

  private normalizeRoleFilter(role?: UserRole | 'ALL' | ''): string {
    if (!role || role === 'ALL') {
      return '';
    }

    return toBackendUserRole(role);
  }

  private normalizeStatusFilter(status?: 'ACTIVE' | 'INACTIVE' | 'ALL' | ''): string {
    if (!status || status === 'ALL') {
      return '';
    }

    return status;
  }

  private emptySummary(): AdminUserSummary {
    return {
      totalUsers: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      adminCount: 0,
      inventoryManagerCount: 0,
      purchaseOfficerCount: 0,
      warehouseStaffCount: 0,
      recentLoginCount: 0,
    };
  }
}
