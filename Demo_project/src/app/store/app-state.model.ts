export interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  status: 'Active' | 'Inactive';
  company: string;
  phone: string;
  createdAt: string;
}

export interface DashboardStats {
  revenue: number;
  revenueChange: number;
  ordersCount: number;
  ordersChange: number;
  conversionRate: number;
  conversionChange: number;
}

export interface OnboardingWizard {
  step: number;
  name: string;
  email: string;
  role: User['role'] | '';
}

export interface AppState {
  users: User[];
  dashboard: DashboardStats;
  nextUserId: number;
  currentUserId: number | null;
  onboarding: OnboardingWizard;
}

export interface ActionLogEntry {
  timestamp: string;
  actionName: string;
  payload?: unknown;
}
