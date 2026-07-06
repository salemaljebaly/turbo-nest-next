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
export type StaffRole = OrganizationRole;
export type RolePermissions = Partial<
  Record<PermissionResource, PermissionAction[]>
>;

const fullActions = [...permissionActions];
const readList: PermissionAction[] = ["list", "read"];

export const rolePermissions: Record<OrganizationRole, RolePermissions> = {
  owner: Object.fromEntries(
    permissionResources.map((resource) => [resource, fullActions]),
  ) as Required<RolePermissions>,
  admin: {
    projects: fullActions,
    storage: fullActions,
    notifications: fullActions,
    audit: readList,
  },
  member: {
    projects: ["create", "list", "read", "update", "export"],
    storage: ["create", "read"],
    notifications: readList,
  },
  viewer: {
    projects: readList,
    audit: readList,
  },
} satisfies Record<OrganizationRole, RolePermissions>;

export function parseRoles(value: unknown): StaffRole[] {
  if (Array.isArray(value)) {
    return value.filter((role): role is StaffRole =>
      organizationRoles.includes(role as StaffRole),
    );
  }
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((role) => role.trim())
    .filter((role): role is StaffRole =>
      organizationRoles.includes(role as StaffRole),
    );
}

export function can(
  roles: StaffRole[],
  resource: PermissionResource,
  action: PermissionAction,
) {
  return roles.some((role) =>
    rolePermissions[role][resource]?.includes(action),
  );
}
