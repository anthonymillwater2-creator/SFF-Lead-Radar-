import { BuyerType, LeadStatus, OverrideReason } from '@prisma/client';

export interface ScoringResult {
  score: number;
  buyerType: BuyerType;
  painTags: string[];
  status: LeadStatus;
  overrideReason?: OverrideReason;
  rush12HourEligible: boolean;
  ruleMatches: string[];
}

const SELLER_PATTERNS = [
  /\[for hire\]/i,
  /\bfor hire\b/i,
  /\bmy portfolio\b/i,
  /\bportfolio link\b/i,
  /\bmy rates\b/i,
  /\brates are\b/i,
  /\bavailable for work\b/i,
  /\bhire me\b/i,
  /\beditor looking for work\b/i,
];

const JOB_BOARD_HOSTS = [
  'upwork.com',
  'fiverr.com',
  'freelancer.com',
  'peopleperhour.com',
  'guru.com',
  'toptal.com',
];

export function scoreLead(
  title: string,
  snippet: string,
  sourceHost: string,
  blocklist: string[] = []
): ScoringResult {
  const text = `${title} ${snippet}`.toLowerCase();
  const ruleMatches: string[] = [];
  let score = 0;

  // HARD REJECT: Seller posts
  for (const pattern of SELLER_PATTERNS) {
    if (pattern.test(text)) {
      return {
        score: 0,
        buyerType: BuyerType.UNKNOWN,
        painTags: [],
        status: LeadStatus.REJECTED,
        overrideReason: OverrideReason.SELLER_POST,
        rush12HourEligible: false,
        ruleMatches: ['REJECTED: Seller pattern detected'],
      };
    }
  }

  // HARD REJECT: Job board marketplace
  const allBlockedHosts = [...JOB_BOARD_HOSTS, ...blocklist];
  if (allBlockedHosts.some((host) => sourceHost.includes(host))) {
    return {
      score: 0,
      buyerType: BuyerType.UNKNOWN,
      painTags: [],
      status: LeadStatus.REJECTED,
      overrideReason: OverrideReason.JOB_BOARD,
      rush12HourEligible: false,
      ruleMatches: ['REJECTED: Job board/marketplace'],
    };
  }

  // HIGH INTENT SCORING
  if (
    /\bhiring\b/i.test(text) ||
    /\blooking for\b/i.test(text) ||
    /\bneed an editor\b/i.test(text) ||
    /\bvideo editor needed\b/i.test(text)
  ) {
    score += 25;
    ruleMatches.push('+25: High intent keywords (hiring/looking for/need)');
  }

  if (
    /\bdeadline\b/i.test(text) ||
    /\basap\b/i.test(text) ||
    /\burgent\b/i.test(text) ||
    /\brush\b/i.test(text) ||
    /\bbehind\b/i.test(text) ||
    /\bswamped\b/i.test(text) ||
    /\boverwhelmed\b/i.test(text) ||
    /\bbacklog\b/i.test(text)
  ) {
    score += 15;
    ruleMatches.push('+15: Urgency/pain keywords');
  }

  if (
    /\bagency\b/i.test(text) ||
    /\bwhite label\b/i.test(text) ||
    /\bclient\b/i.test(text) ||
    /\boverflow\b/i.test(text)
  ) {
    score += 10;
    ruleMatches.push('+10: Agency/overflow indicators');
  }

  if (
    /\bpodcast\b/i.test(text) ||
    /\brepurpose\b/i.test(text) ||
    /\bclips\b/i.test(text) ||
    /\bhighlights\b/i.test(text)
  ) {
    score += 10;
    ruleMatches.push('+10: Podcast/repurpose content');
  }

  if (
    /\bshorts\b/i.test(text) ||
    /\breels\b/i.test(text) ||
    /\btiktok\b/i.test(text) ||
    /\bshort form\b/i.test(text)
  ) {
    score += 10;
    ruleMatches.push('+10: Short-form content');
  }

  if (/\bcapcut\b/i.test(text)) {
    score += 5;
    ruleMatches.push('+5: CapCut mentioned');
  }

  // BUYER TYPE DETECTION
  let buyerType: BuyerType = BuyerType.UNKNOWN;
  if (/\bagency\b/i.test(text)) {
    buyerType = BuyerType.AGENCY as BuyerType;
  } else if (/\bpodcast/i.test(text)) {
    buyerType = BuyerType.PODCASTER as BuyerType;
  } else if (/\bcoach\b/i.test(text) || /\bconsultant\b/i.test(text)) {
    buyerType = BuyerType.COACH as BuyerType;
  } else if (/\becom\b/i.test(text) || /\bugc\b/i.test(text) || /\bads\b/i.test(text)) {
    buyerType = BuyerType.ECOM as BuyerType;
  } else if (
    /\bcreator\b/i.test(text) ||
    /\byoutuber\b/i.test(text) ||
    /\binfluencer\b/i.test(text)
  ) {
    buyerType = BuyerType.CREATOR as BuyerType;
  }

  // PAIN TAGS
  const painTags: string[] = [];
  if (/\bdeadline\b/i.test(text) || /\basap\b/i.test(text) || /\burgent\b/i.test(text)) {
    painTags.push('deadline');
  }
  if (/\bswamped\b/i.test(text) || /\boverwhelmed\b/i.test(text) || /\bbacklog\b/i.test(text)) {
    painTags.push('volume');
  }
  if (/\boverflow\b/i.test(text)) {
    painTags.push('overflow');
  }
  if (/\brepurpose\b/i.test(text) || /\bclips\b/i.test(text)) {
    painTags.push('repurpose');
  }

  // RUSH 12-HOUR ELIGIBLE
  const rush12HourEligible =
    /\brush\b/i.test(text) ||
    /\basap\b/i.test(text) ||
    /\btoday\b/i.test(text) ||
    /\bimmediate/i.test(text);

  // QUALIFICATION & STATUS
  let status: LeadStatus = LeadStatus.REVIEW;
  if (score >= 70) {
    status = LeadStatus.OUTREACH_READY as LeadStatus;
  } else if (score < 40) {
    status = LeadStatus.REJECTED as LeadStatus;
  }

  return {
    score: Math.min(100, score),
    buyerType,
    painTags,
    status,
    rush12HourEligible,
    ruleMatches,
  };
}
