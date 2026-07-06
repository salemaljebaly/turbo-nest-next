export const permissionResources = [
  "projects",
  "storage",
  "notifications",
  "audit",
] as const;

export const permissionActions = [
  "approve",
  "create",
  "delete",
  "export",
  "list",
  "read",
  "update",
] as const;

export const organizationRoles = [
  "owner",
  "admin",
  "member",
  "viewer",
] as const;

export type PermissionResource = (typeof permissionResources)[number];
export type PermissionAction = (typeof permissionActions)[number];
export type OrganizationRole = (typeof organizationRoles)[number];
export type Permission = `${PermissionResource}:${PermissionAction}`;
