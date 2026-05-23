/** Apex extraction via tldts (PRD glossary, D-001). */

/* v8 ignore next */
import { getDomain } from 'tldts';

/**
 * Returns the lowercase apex domain for a URL per the Public Suffix List,
 * or null if the URL has no resolvable apex (data:, file:, IP literals, etc.).
 * Matches PRD glossary "Apex domain".
 */
export function apexOf(url: string): string | null {
  // Private PSL entries (e.g. github.io) need allowPrivateDomains per PRD glossary.
  const apex = getDomain(url, { allowPrivateDomains: true });
  if (apex === null) {
    return null;
  }
  return apex.toLowerCase();
}
