import { describe, expect, it, vi } from 'vitest';
import { NotificationsService } from './notifications.service.js';

function createDb(selected: unknown[]) {
  const selectWhere = vi.fn().mockResolvedValue(selected);
  const select = vi.fn(() => ({
    from: () => ({
      where: selectWhere,
    }),
  }));

  const updateWhere = vi.fn().mockResolvedValue(undefined);
  const updateSet = vi.fn(() => ({ where: updateWhere }));
  const update = vi.fn(() => ({ set: updateSet }));

  return {
    db: { select, update },
    updateSet,
  };
}

describe(NotificationsService.name, () => {
  it('sends the stored notification payload and marks it sent', async () => {
    const { db, updateSet } = createDb([
      {
        userId: 'user-1',
        title: 'Project approved',
        body: 'Launch was approved.',
      },
    ]);
    const provider = { send: vi.fn().mockResolvedValue(undefined) };
    const service = new NotificationsService(db as never, provider);

    await service.send('notification-1');

    expect(provider.send).toHaveBeenCalledWith({
      userId: 'user-1',
      title: 'Project approved',
      body: 'Launch was approved.',
    });
    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'sent', sentAt: expect.any(Date) }),
    );
  });

  it('does not call the provider when the notification does not exist', async () => {
    const { db, updateSet } = createDb([]);
    const provider = { send: vi.fn().mockResolvedValue(undefined) };
    const service = new NotificationsService(db as never, provider);

    await service.send('missing');

    expect(provider.send).not.toHaveBeenCalled();
    expect(updateSet).not.toHaveBeenCalled();
  });
});
