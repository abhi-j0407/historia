import { describe, expect, it } from 'vitest';

import { apexOf } from './domain';

describe('apexOf', () => {
  it('resolves multi-subdomain hosts to the registrable apex', () => {
    expect(apexOf('https://mail.google.com/inbox')).toBe('google.com');
    expect(apexOf('https://docs.google.com/document/d/1')).toBe('google.com');
  });

  it('respects Public Suffix List edge cases', () => {
    expect(apexOf('https://user.github.io/repo')).toBe('user.github.io');
    expect(apexOf('https://www.example.co.uk/path')).toBe('example.co.uk');
  });

  it('lowercases the apex domain', () => {
    expect(apexOf('https://EXAMPLE.com/PATH')).toBe('example.com');
    expect(apexOf('https://example.com/')).toBe('example.com');
  });

  it('returns null for non-apex URLs', () => {
    expect(apexOf('data:text/plain,hi')).toBeNull();
    expect(apexOf('file:///tmp/x.txt')).toBeNull();
    expect(apexOf('http://127.0.0.1/')).toBeNull();
    expect(apexOf('http://[::1]/')).toBeNull();
    expect(apexOf('not a url')).toBeNull();
  });
});
