import { SourcePack } from '@prisma/client';

const NEGATIVE_SITES_BLOCK = '-site:upwork.com -site:fiverr.com -site:freelancer.com -site:peopleperhour.com';

export function buildFinalQuery(
  baseQueryText: string,
  sourcePack: SourcePack,
  additionalBlocklist: string[] = []
): string {
  let siteConstraint = '';

  switch (sourcePack) {
    case SourcePack.FORUMS:
      siteConstraint = '(site:reddit.com OR site:quora.com OR site:redditmedia.com)';
      break;
    case SourcePack.SOCIAL:
      siteConstraint = '(site:x.com OR site:facebook.com OR site:twitter.com)';
      break;
    case SourcePack.PROFESSIONAL:
      siteConstraint = '(site:linkedin.com OR site:medium.com)';
      break;
    case SourcePack.WIDE_WEB:
    default:
      siteConstraint = '';
      break;
  }

  // Build negative site block
  const additionalNegatives = additionalBlocklist
    .map((host) => `-site:${host}`)
    .join(' ');
  const fullNegativeBlock = [NEGATIVE_SITES_BLOCK, additionalNegatives]
    .filter(Boolean)
    .join(' ');

  // Combine everything
  const parts = [siteConstraint, baseQueryText, fullNegativeBlock].filter(Boolean);

  return parts.join(' ').trim();
}

export function getSourcePackLabel(sourcePack: SourcePack): string {
  switch (sourcePack) {
    case SourcePack.FORUMS:
      return 'Forums (Reddit, Quora)';
    case SourcePack.SOCIAL:
      return 'Social (X, Facebook)';
    case SourcePack.PROFESSIONAL:
      return 'Professional (LinkedIn, Medium)';
    case SourcePack.WIDE_WEB:
      return 'Wide Web (No site constraints)';
    default:
      return 'Unknown';
  }
}
