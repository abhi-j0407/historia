/**
 * URL filtering per PRD B-001..B-004 and FR-F-01 (data-driven predicate list).
 */

interface ParsedUrl {
  protocol: string;
  hostname: string;
  pathname: string;
  search: string;
}

const SCHEME_PREFIXES = [
  'chrome://',
  'chrome-extension://',
  'about:',
  'edge://',
  'brave://',
  'opera://',
  'vivaldi://',
  'file://',
  'chrome-search://',
  'chrome-untrusted://',
  'devtools://',
  'view-source:',
  'data:',
  'javascript:',
] as const;

const GOOGLE_HOST = /(^|\.)google\.[a-z.]+$/;
const BING_HOST = /(^|\.)bing\.com$/;
const ECOSIA_HOST = /(^|\.)ecosia\.org$/;
const STARTPAGE_HOST = /(^|\.)startpage\.com$/;
const BAIDU_HOST = /(^|\.)baidu\.com$/;
const YANDEX_HOST = /(^|\.)yandex\.[a-z.]+$/;

function normalizeHostname(hostname: string): string {
  const lower = hostname.toLowerCase();
  if (lower.startsWith('[') && lower.endsWith(']')) {
    return lower.slice(1, -1);
  }
  return lower;
}

function tryParse(url: string): ParsedUrl | null {
  if (url === '') {
    return null;
  }
  try {
    const parsed = new URL(url);
    return {
      protocol: parsed.protocol,
      hostname: normalizeHostname(parsed.hostname),
      pathname: parsed.pathname,
      search: parsed.search,
    };
  } catch {
    return null;
  }
}

function matchesSchemePrefix(url: string): boolean {
  const lower = url.toLowerCase();
  return SCHEME_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

function isNewTabPlaceholder(url: string): boolean {
  return url === 'chrome://newtab/' || url === 'about:blank' || url === '';
}

function isLocalHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname.endsWith('.local')
  );
}

function isGoogleSearchResult(parsed: ParsedUrl): boolean {
  return GOOGLE_HOST.test(parsed.hostname) && parsed.pathname === '/search';
}

function isBingSearchResult(parsed: ParsedUrl): boolean {
  return BING_HOST.test(parsed.hostname) && parsed.pathname === '/search';
}

function isDuckDuckGoSearchResult(parsed: ParsedUrl): boolean {
  return (
    parsed.hostname === 'duckduckgo.com' && parsed.pathname === '/' && parsed.search.includes('q=')
  );
}

function isBraveSearchResult(parsed: ParsedUrl): boolean {
  return parsed.hostname === 'search.brave.com' && parsed.pathname.startsWith('/search');
}

function isEcosiaSearchResult(parsed: ParsedUrl): boolean {
  return ECOSIA_HOST.test(parsed.hostname) && parsed.pathname === '/search';
}

function isStartpageSearchResult(parsed: ParsedUrl): boolean {
  return (
    STARTPAGE_HOST.test(parsed.hostname) &&
    (parsed.pathname.startsWith('/sp/search') || parsed.pathname.startsWith('/do/search'))
  );
}

function isYahooSearchResult(parsed: ParsedUrl): boolean {
  return parsed.hostname === 'search.yahoo.com';
}

function isBaiduSearchResult(parsed: ParsedUrl): boolean {
  return BAIDU_HOST.test(parsed.hostname) && parsed.pathname === '/s';
}

function isYandexSearchResult(parsed: ParsedUrl): boolean {
  return YANDEX_HOST.test(parsed.hostname) && parsed.pathname.startsWith('/search');
}

function isSearchEngineResultPage(parsed: ParsedUrl): boolean {
  return (
    isGoogleSearchResult(parsed) ||
    isBingSearchResult(parsed) ||
    isDuckDuckGoSearchResult(parsed) ||
    isBraveSearchResult(parsed) ||
    isEcosiaSearchResult(parsed) ||
    isStartpageSearchResult(parsed) ||
    isYahooSearchResult(parsed) ||
    isBaiduSearchResult(parsed) ||
    isYandexSearchResult(parsed)
  );
}

const dropPredicates: ((url: string, parsed: ParsedUrl | null) => boolean)[] = [
  (url) => matchesSchemePrefix(url),
  (url) => isNewTabPlaceholder(url),
  (_url, parsed) => parsed === null,
  (_url, parsed) => parsed !== null && isLocalHost(parsed.hostname),
  (_url, parsed) => parsed !== null && isSearchEngineResultPage(parsed),
];

/** Returns true when the URL must be excluded from visit ingestion (B-001..B-004). */
export function shouldDropURL(url: string): boolean {
  const parsed = tryParse(url);
  return dropPredicates.some((predicate) => predicate(url, parsed));
}
