import { describe, expect, it } from 'vitest';
import { PingResult } from './index';

describe('PingResult', () => {
  it('hydrates a raw ping response into a typed entity', () => {
    const result = new PingResult({ userId: 'user-123', timestamp: '2026-01-01T12:00:00.000Z' });

    expect(result.userId).toBe('user-123');
    expect(result.timestamp).toBeInstanceOf(Date);
    expect(result.timestamp.toISOString()).toBe('2026-01-01T12:00:00.000Z');
  });
});
