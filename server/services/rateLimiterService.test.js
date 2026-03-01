import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isRateLimitAllowed } from './rateLimiterService.js';

describe('rateLimiterService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('allows first request', () => {
    expect(isRateLimitAllowed('192.168.1.1')).toBe(true);
  });

  it('allows up to 30 requests in a minute', () => {
    const ip = '10.0.0.1'; // unique IP so other tests do not affect count
    for (let i = 0; i < 30; i++) {
      expect(isRateLimitAllowed(ip)).toBe(true);
    }
    expect(isRateLimitAllowed(ip)).toBe(false);
  });

  it('resets after window expires', () => {
    const ip = '10.0.0.2';
    for (let i = 0; i < 31; i++) isRateLimitAllowed(ip);
    expect(isRateLimitAllowed(ip)).toBe(false);
    vi.advanceTimersByTime(61 * 1000);
    expect(isRateLimitAllowed(ip)).toBe(true);
  });

  it('tracks different IPs separately', () => {
    for (let i = 0; i < 30; i++) isRateLimitAllowed('1.1.1.1');
    expect(isRateLimitAllowed('1.1.1.1')).toBe(false);
    expect(isRateLimitAllowed('2.2.2.2')).toBe(true);
  });
});
