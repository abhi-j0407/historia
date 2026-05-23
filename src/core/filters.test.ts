import { describe, expect, it } from 'vitest';

import { shouldDropURL } from './filters';

const SCHEME_DROP_URLS = [
  'chrome://settings/',
  'chrome-extension://abc123/popup.html',
  'about:preferences',
  'edge://settings/',
  'brave://settings/',
  'opera://settings/',
  'vivaldi://settings/',
  'file:///tmp/readme.txt',
  'chrome-search://local-ntp/local-ntp.html',
  'chrome-untrusted://new-tab-page/',
  'devtools://devtools/bundled/inspector.html',
  'view-source:https://example.com',
  'data:text/plain,hello',
  'javascript:void(0)',
] as const;

describe('B-001 scheme filter', () => {
  it.each(SCHEME_DROP_URLS)('drops %s', (url) => {
    expect(shouldDropURL(url)).toBe(true);
  });

  it('keeps a normal https URL', () => {
    expect(shouldDropURL('https://example.com/path')).toBe(false);
  });
});

describe('B-002 new tab placeholder filter', () => {
  it.each(['chrome://newtab/', 'about:blank', ''])('drops %j', (url) => {
    expect(shouldDropURL(url)).toBe(true);
  });

  it('keeps a normal https URL', () => {
    expect(shouldDropURL('https://example.com')).toBe(false);
  });
});

describe('B-003 local host filter', () => {
  it.each([
    'http://localhost/',
    'http://127.0.0.1/app',
    'http://0.0.0.0/',
    'http://[::1]/',
    'http://dev.machine.local/',
  ])('drops %s', (url) => {
    expect(shouldDropURL(url)).toBe(true);
  });

  it('keeps a hostname that only contains localhost as a substring', () => {
    expect(shouldDropURL('https://app.localhost.example.com/')).toBe(false);
  });
});

describe('B-004 search engine results filter', () => {
  it.each([
    ['Google', 'https://www.google.com/search?q=test'],
    ['Bing', 'https://www.bing.com/search?q=test'],
    ['DuckDuckGo', 'https://duckduckgo.com/?q=test'],
    ['Brave', 'https://search.brave.com/search?q=test'],
    ['Ecosia', 'https://www.ecosia.org/search?q=test'],
    ['Startpage /sp/search', 'https://www.startpage.com/sp/search?q=test'],
    ['Startpage /do/search', 'https://www.startpage.com/do/search?q=test'],
    ['Yahoo', 'https://search.yahoo.com/search?p=test'],
    ['Baidu', 'https://www.baidu.com/s?wd=test'],
    ['Yandex', 'https://yandex.com/search/?text=test'],
  ])('drops %s search result %s', (_engine, url) => {
    expect(shouldDropURL(url)).toBe(true);
  });

  it.each([
    ['Google maps', 'https://www.google.com/maps'],
    ['DuckDuckGo home', 'https://duckduckgo.com/'],
    ['Brave non-search path', 'https://search.brave.com/help'],
    ['Startpage about', 'https://www.startpage.com/about'],
    ['Bing home', 'https://www.bing.com/'],
    ['Ecosia home', 'https://www.ecosia.org/'],
    ['Baidu home', 'https://www.baidu.com/'],
    ['Yandex home', 'https://yandex.com/'],
    ['Yahoo non-search host', 'https://www.yahoo.com/'],
  ])('keeps non-search page: %s (%s)', (_label, url) => {
    expect(shouldDropURL(url)).toBe(false);
  });
});

describe('malformed URLs', () => {
  it('drops strings that cannot be parsed as URLs', () => {
    expect(shouldDropURL('not a url')).toBe(true);
    expect(shouldDropURL('://')).toBe(true);
  });
});
