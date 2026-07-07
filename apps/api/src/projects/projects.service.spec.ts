import { describe, expect, it, vi } from 'vitest';
import { ProjectsService } from './projects.service.js';

function createDb({
  selected = [],
  updated = [],
}: {
  selected?: unknown[];
  updated?: unknown[];
} = {}) {
  const selectWhere = vi.fn().mockResolvedValue(selected);
  const select = vi.fn(() => ({
    from: () => ({
      where: selectWhere,
    }),
  }));

  const updateReturning = vi.fn().mockResolvedValue(updated);
  const updateWhere = vi.fn(() => ({ returning: updateReturning }));
  const updateSet = vi.fn(() => ({ where: updateWhere }));
  const update = vi.fn(() => ({ set: updateSet }));

  return {
    db: { select, update },
    selectWhere,
    updateSet,
    updateWhere,
  };
}

function createService(db: unknown) {
  const realtime = { emitToUser: vi.fn() };
  const notifications = { queue: vi.fn().mockResolvedValue({ id: 'note-1' }) };
  return {
    service: new ProjectsService(
      db as never,
      realtime as never,
      notifications as never,
    ),
    realtime,
    notifications,
  };
}

describe(ProjectsService.name, () => {
  it('throws the registry code when a project is missing', async () => {
    const { db } = createDb();
    const { service } = createService(db);

    await expect(service.get('user-1', 'project-1')).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'PROJECT_NOT_FOUND' }),
      status: 404,
    });
  });

  it('rejects updates to archived projects', async () => {
    const { db, updateSet } = createDb({
      selected: [{ id: 'project-1', ownerId: 'user-1', status: 'archived' }],
    });
    const { service } = createService(db);

    await expect(
      service.update('user-1', 'project-1', { name: 'Changed' }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'PROJECT_ARCHIVED' }),
      status: 409,
    });
    expect(updateSet).not.toHaveBeenCalled();
  });

  it('allows a different approver to approve another owner project', async () => {
    const approved = {
      id: 'project-1',
      ownerId: 'owner-1',
      requestedById: 'owner-1',
      status: 'approved',
      name: 'Launch',
    };
    const { db, updateSet, updateWhere } = createDb({
      selected: [
        {
          id: 'project-1',
          ownerId: 'owner-1',
          requestedById: 'owner-1',
          status: 'active',
          name: 'Launch',
        },
      ],
      updated: [approved],
    });
    const { service, realtime, notifications } = createService(db);

    await expect(service.approve('admin-1', 'project-1')).resolves.toEqual(
      approved,
    );
    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'approved',
        approvedById: 'admin-1',
      }),
    );
    expect(updateWhere).toHaveBeenCalledOnce();
    expect(realtime.emitToUser).toHaveBeenCalledWith(
      'owner-1',
      'project.updated',
      approved,
    );
    expect(notifications.queue).toHaveBeenCalledWith(
      'owner-1',
      'Project approved',
      'Launch was approved.',
    );
  });

  it('rejects approval by the original requester', async () => {
    const { db, updateSet } = createDb({
      selected: [
        {
          id: 'project-1',
          ownerId: 'owner-1',
          requestedById: 'owner-1',
          status: 'active',
        },
      ],
    });
    const { service } = createService(db);

    await expect(service.approve('owner-1', 'project-1')).rejects.toMatchObject(
      {
        response: expect.objectContaining({
          code: 'SEPARATION_OF_DUTIES_VIOLATION',
        }),
      },
    );
    expect(updateSet).not.toHaveBeenCalled();
  });
});
