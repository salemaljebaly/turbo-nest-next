import { describe, expect, it } from 'vitest';
import { roleCan, rolePermissions } from './permissions.js';

describe('generic RBAC matrix', () => {
  it('keeps owner as the full access role', () => {
    expect(rolePermissions.owner).toContain('projects:approve');
    expect(roleCan('owner', 'audit', 'read')).toBe(true);
  });

  it('allows members to write projects but not approve them', () => {
    expect(roleCan('member', 'projects', 'create')).toBe(true);
    expect(roleCan('member', 'projects', 'approve')).toBe(false);
  });

  it('keeps viewers read-only', () => {
    expect(roleCan('viewer', 'projects', 'read')).toBe(true);
    expect(roleCan('viewer', 'projects', 'update')).toBe(false);
  });
});
