import {
  organizationRoles,
  permissionActions,
  permissionResources,
  type OrganizationRole,
  type Permission,
  type PermissionAction,
  type PermissionResource,
} from '@repo/types';

export { organizationRoles, permissionActions, permissionResources };
export type {
  OrganizationRole,
  Permission,
  PermissionAction,
  PermissionResource,
};
export type RolePermissions = Record<OrganizationRole, readonly Permission[]>;

const projectWrite = [
  'projects:create',
  'projects:update',
  'projects:delete',
] as const;
const projectRead = [
  'projects:list',
  'projects:read',
  'projects:export',
] as const;

export const rolePermissions = {
  owner: [
    ...projectRead,
    ...projectWrite,
    'projects:approve',
    'storage:create',
    'storage:read',
    'notifications:create',
    'notifications:read',
    'audit:list',
    'audit:read',
  ],
  admin: [
    ...projectRead,
    ...projectWrite,
    'projects:approve',
    'storage:create',
    'storage:read',
    'notifications:create',
    'notifications:read',
    'audit:list',
    'audit:read',
  ],
  member: [
    ...projectRead,
    'projects:create',
    'projects:update',
    'storage:create',
    'storage:read',
    'notifications:read',
  ],
  viewer: [...projectRead, 'storage:read', 'notifications:read'],
} as const satisfies RolePermissions;

export function parseRole(value: string | null | undefined): OrganizationRole {
  return organizationRoles.includes(value as OrganizationRole)
    ? (value as OrganizationRole)
    : 'owner';
}

export function toPermission(
  resource: PermissionResource,
  action: PermissionAction,
): Permission {
  return `${resource}:${action}`;
}

export function roleCan(
  role: OrganizationRole,
  resource: PermissionResource,
  action: PermissionAction,
) {
  return (rolePermissions[role] as readonly Permission[]).includes(
    toPermission(resource, action),
  );
}
