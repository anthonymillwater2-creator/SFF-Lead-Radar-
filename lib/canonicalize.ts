import crypto from 'crypto';

/**
 * URL Canonicalization Rules:
 * 1. Remove fragments (#...)
 * 2. Normalize host (lowercase, remove www.)
 * 3. Remove trailing slash
 * 4. Remove tracking params (utm_*, gclid, fbclid, etc.)
 * 5. Drop "?" if querystring becomes empty
 */

const TRACKING_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'fbclid',
  'ref',
  'source',
  'campaign',
  'mc_cid',
  'mc_eid',
  '_ga',
  '_gl',
];

export function canonicalizeUrl(url: string): { canonical: string; hash: string } {
  try {
    const urlObj = new URL(url);

    // 1. Remove fragment
    urlObj.hash = '';

    // 2. Normalize host (lowercase, remove www.)
    urlObj.hostname = urlObj.hostname.toLowerCase().replace(/^www\./, '');

    // 3. Remove tracking params
    const params = new URLSearchParams(urlObj.search);
    TRACKING_PARAMS.forEach((param) => params.delete(param));

    // 4. Update search or remove if empty
    const searchString = params.toString();
    urlObj.search = searchString ? `?${searchString}` : '';

    // 5. Remove trailing slash from pathname (unless it's just "/")
    if (urlObj.pathname !== '/' && urlObj.pathname.endsWith('/')) {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }

    const canonical = urlObj.toString();
    const hash = crypto.createHash('sha256').update(canonical).digest('hex');

    return { canonical, hash };
  } catch (error) {
    // If URL parsing fails, return original with hash
    const hash = crypto.createHash('sha256').update(url).digest('hex');
    return { canonical: url, hash };
  }
}

export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}
