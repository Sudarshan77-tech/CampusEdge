import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('Web Utilities - cn', () => {
  it('merges tailwind class names properly', () => {
    const result = cn('px-2 py-1', 'bg-blue-500', { 'text-white': true });
    expect(result).toBe('px-2 py-1 bg-blue-500 text-white');
  });

  it('handles conflicting tailwind classes correctly', () => {
    const result = cn('p-2', 'p-4');
    expect(result).toBe('p-4');
  });
});
