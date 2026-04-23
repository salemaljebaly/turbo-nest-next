import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const PORT = 3101;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let serverProcess: ChildProcessWithoutNullStreams | null = null;

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${BASE_URL}/api`);
      if (response.ok) return;
    } catch {
      // Server is still starting up.
    }

    await delay(500);
  }

  throw new Error('API server did not become ready in time.');
}

describe('AppController (e2e)', () => {
  beforeAll(async () => {
    serverProcess = spawn('node', ['dist/main.js'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PORT: String(PORT),
        NODE_ENV: 'test',
      },
      stdio: 'pipe',
    });

    serverProcess.stdout.on('data', () => {
      // Keep stdout drained so the child process cannot block on output.
    });

    serverProcess.stderr.on('data', () => {
      // Keep stderr drained so the child process cannot block on output.
    });

    await waitForServer();
  }, 30000);

  afterAll(async () => {
    if (!serverProcess || serverProcess.killed) return;

    serverProcess.kill('SIGTERM');
    await delay(500);

    if (!serverProcess.killed) {
      serverProcess.kill('SIGKILL');
    }
  });

  it('GET /api should return 200', async () => {
    const response = await fetch(`${BASE_URL}/api`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        message: expect.stringContaining('Hello from'),
      },
    });
  });
});
