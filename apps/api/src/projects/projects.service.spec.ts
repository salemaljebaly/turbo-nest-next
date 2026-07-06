import { describe, expect, it, vi } from 'vitest';
import { ProjectsService } from './projects.service.js';

describe(ProjectsService.name, () => {
  it('throws the registry code when a project is missing', async () => {
    const db = {
      select: vi.fn(() => ({
        from: () => ({
          where: () => Promise.resolve([]),
        }),
      })),
    };
    const service = new ProjectsService(
      db as never,
      { emitToUser: vi.fn() } as never,
      { queue: vi.fn() } as never,
    );

    await expect(service.get('user-1', 'project-1')).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'PROJECT_NOT_FOUND' }),
      status: 404,
    });
  });
});
