import { AdminRole } from './auth';

export type Permission = 
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'customers'
  | 'coupons'
  | 'banners'
  | 'settings'
  | 'team';

export const ROLE_PERMISSIONS: Record<NonNullable<AdminRole>, Permission[]> = {
  super_admin: ['dashboard', 'orders', 'products', 'customers', 'coupons', 'banners', 'settings', 'team'],
  admin: ['dashboard', 'orders', 'products', 'customers', 'coupons', 'banners', 'settings'],
  moderator: ['dashboard', 'orders', 'products', 'banners'],
  officer: ['dashboard', 'orders'],
};

export function hasPermission(role: AdminRole, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPermissions(role: AdminRole): Permission[] {
  if (!role) return [];
  return ROLE_PERMISSIONS[role] ?? [];
}