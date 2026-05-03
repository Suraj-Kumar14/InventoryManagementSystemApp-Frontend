import { AlertResponse, AlertSummaryResponse, ExecutiveDashboardReportResponse, MovementSummaryResponse, PaymentSummaryReportResponse } from '../../../core/http/backend.models';
import { UserRole } from '../../../shared/config/app-config';

export type AdminDashboardSectionKey =
  | 'executive'
  | 'alerts'
  | 'users'
  | 'payments'
  | 'activity'
  | 'health';

export interface AdminDashboardUserSummary {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: Record<UserRole, number>;
}

export interface ServiceHealth {
  serviceName: string;
  status: 'UP' | 'DOWN' | 'DEGRADED';
  lastCheckedAt?: string;
  message?: string;
}

export interface RecentActivity {
  id: string;
  type: 'ALERT' | 'MOVEMENT' | 'PURCHASE' | 'USER';
  title: string;
  description: string;
  actor?: string;
  createdAt?: string;
  route?: string;
}

export interface AdminDashboardKpiCard {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  route?: string;
  severity?: 'default' | 'warning' | 'critical' | 'success';
}

export interface DashboardQuickAction {
  label: string;
  route: string;
  icon: string;
  allowedRoles: UserRole[];
}

export interface AdminDashboardView {
  executive: ExecutiveDashboardReportResponse | null;
  alertSummary: AlertSummaryResponse | null;
  unreadAlertCount: number | null;
  userSummary: AdminDashboardUserSummary | null;
  paymentSummary: PaymentSummaryReportResponse | null;
  movementSummary: MovementSummaryResponse | null;
  recentAlerts: AlertResponse[];
  recentActivities: RecentActivity[];
  serviceHealth: ServiceHealth[];
  serviceHealthConfigured: boolean;
  sectionErrors: Partial<Record<AdminDashboardSectionKey, string>>;
  generatedAt: string;
}
