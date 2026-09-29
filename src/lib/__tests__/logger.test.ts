import { vi, describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

/** The logger module as it is built for the given environment. */
async function loggerFor(env: Record<string, string>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  return import('../logger');
}

describe('logger', () => {
  it('is silent in tests', async () => {
    const { default: logger } = await loggerFor({ NODE_ENV: 'test' });
    expect(logger.level).toBe('silent');
  });

  it('writes JSON lines with readable levels and hidden secrets in production', async () => {
    const file = path.join(
      await mkdtemp(path.join(tmpdir(), 'khz-log-')),
      'app.log'
    );
    const { createLogger, default: root } = await loggerFor({
      NODE_ENV: 'production',
      LOG_FILE_PATH: file,
      LOG_LEVEL: 'warn',
    });
    const log = createLogger('admin');
    log.info('below the configured level');
    log.warn(
      { user: { password: 'tajne-haslo' }, token: 'abc' },
      'Sign-in failed'
    );
    root.flush();
    await vi.waitFor(async () =>
      expect(await readFile(file, 'utf8')).toContain('Sign-in failed')
    );

    const lines = (await readFile(file, 'utf8'))
      .trim()
      .split('\n')
      .map((l) => JSON.parse(l));
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      level: 'warn',
      module: 'admin',
      msg: 'Sign-in failed',
      user: { password: '[Redacted]' },
      token: '[Redacted]',
    });
  });

  it('logs to standard output at info level by default in production', async () => {
    const { default: logger } = await loggerFor({
      NODE_ENV: 'production',
      LOG_FILE_PATH: '',
      LOG_LEVEL: '',
    });
    expect(logger.level).toBe('info');
  });
});
