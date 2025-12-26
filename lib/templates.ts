import { Template, BuyerType, MappedService, OfferAngle, TemplateType } from '@prisma/client';

export interface Lead {
  buyerType: BuyerType;
  mappedService: MappedService;
  offerAngle: OfferAngle;
  painTags: string[];
  rush12HourEligible: boolean;
  title: string;
  originalUrl: string;
}

export interface TemplateFillContext {
  lead: Lead;
  settings: {
    orderPageUrl: string;
    utmSource: string;
    utmMedium: string;
  };
  leadId?: string;
  category?: string;
}

/**
 * Template Selection Logic (Deterministic)
 * Score each candidate:
 * +30 if buyer_type matches (ANY = +10)
 * +30 if service matches (ANY = +10)
 * +25 if offer_angle matches (ANY = +10)
 * + priority (integer) as tie-break weight
 *
 * Tie-breakers:
 * 1) highest score
 * 2) highest priority
 * 3) most recently updated
 * 4) first alphabetically by name
 */
export function selectBestTemplate(
  templates: Template[],
  lead: Lead,
  type: TemplateType
): Template | null {
  const candidates = templates.filter((t) => t.type === type && t.isActive);

  if (candidates.length === 0) return null;

  const scored = candidates.map((template) => {
    let score = 0;

    // Buyer type matching
    if (template.applicableBuyerType === lead.buyerType) {
      score += 30;
    } else if (template.applicableBuyerType === BuyerType.UNKNOWN) {
      score += 10;
    }

    // Service matching
    if (template.applicableService === lead.mappedService) {
      score += 30;
    } else if (template.applicableService === MappedService.UNKNOWN) {
      score += 10;
    }

    // Offer angle matching
    if (template.applicableOfferAngle === lead.offerAngle) {
      score += 25;
    } else if (template.applicableOfferAngle === OfferAngle.ANY) {
      score += 10;
    }

    // Add priority
    score += template.priority;

    return { template, score };
  });

  // Sort by score desc, priority desc, updatedAt desc, name asc
  scored.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    if (a.template.priority !== b.template.priority)
      return b.template.priority - a.template.priority;
    if (a.template.updatedAt !== b.template.updatedAt)
      return b.template.updatedAt.getTime() - a.template.updatedAt.getTime();
    return a.template.name.localeCompare(b.template.name);
  });

  return scored[0]?.template || null;
}

/**
 * Placeholder Fill Rules
 * Supported placeholders:
 * {platform} {buyer_type} {service} {offer_angle} {pain_1} {pain_2}
 * {turnaround} {order_link} {source_title} {source_url} {cta_keyword}
 */
export function fillTemplate(
  templateBody: string,
  context: TemplateFillContext
): string {
  const { lead, settings, leadId, category } = context;

  // Build order link with UTM params
  let orderLink = settings.orderPageUrl;
  if (orderLink) {
    const params = new URLSearchParams({
      utm_source: settings.utmSource,
      utm_medium: settings.utmMedium,
      utm_campaign: category || 'leadgen',
      utm_content: leadId || 'unknown',
    });
    orderLink += (orderLink.includes('?') ? '&' : '?') + params.toString();
  }

  // Determine turnaround
  const turnaround = lead.rush12HourEligible
    ? '12-hour rush available'
    : '48-hour turnaround';

  // Determine service label
  const serviceLabels: Record<MappedService, string> = {
    AI_REEL_EDIT: 'AI Reel Edit',
    SOCIAL_MEDIA_EDIT: 'Social Media Edit',
    VIRAL_CAPTIONS: 'Viral Captions',
    PODCAST_YOUTUBE_REPURPOSE: 'Podcast/YouTube Repurpose',
    AUTO_CAPTIONS: 'Auto Captions',
    VIDEO_TRIM_SMART_CUT: 'Video Trim/Smart Cut',
    RUSH_12_HOUR: '12-Hour Rush Edit',
    UNKNOWN: 'short-form editing',
  };

  const service = serviceLabels[lead.mappedService] || 'short-form editing';

  // Determine buyer type label
  const buyerTypeLabels: Record<BuyerType, string> = {
    AGENCY: 'agency',
    PODCASTER: 'podcaster',
    COACH: 'coach',
    ECOM: 'ecommerce',
    CREATOR: 'creator',
    UNKNOWN: 'creator',
  };

  const buyerType = buyerTypeLabels[lead.buyerType] || 'creator';

  // Determine platform
  const platform = 'short-form';

  // Pain tags
  const painTagLabels: Record<string, string> = {
    deadline: 'tight deadlines',
    volume: 'high volume',
    overflow: 'overflow work',
    repurpose: 'repurposing content',
  };

  const pain1 = lead.painTags[0]
    ? painTagLabels[lead.painTags[0]] || lead.painTags[0]
    : 'editing taking too long';
  const pain2 = lead.painTags[1] ? painTagLabels[lead.painTags[1]] || lead.painTags[1] : '';

  // Offer angle label
  const offerAngleLabels: Record<OfferAngle, string> = {
    FIXED_PRICE: 'fixed-price',
    SPEED_48H: 'fast 48-hour',
    LOCAL_US_CA: 'US/Canada local',
    RUSH_12H: '12-hour rush',
    ANY: 'fast turnaround',
  };

  const offerAngle = offerAngleLabels[lead.offerAngle] || 'fast turnaround';

  // CTA keyword
  const ctaKeyword = 'ORDER';

  // Source title and URL
  const sourceTitle = lead.title || '';
  const sourceUrl = lead.originalUrl || '';

  // Replace placeholders
  let filled = templateBody;
  const replacements: Record<string, string> = {
    '{turnaround}': turnaround,
    '{service}': service,
    '{buyer_type}': buyerType,
    '{platform}': platform,
    '{pain_1}': pain1,
    '{pain_2}': pain2,
    '{offer_angle}': offerAngle,
    '{order_link}': orderLink,
    '{cta_keyword}': ctaKeyword,
    '{source_title}': sourceTitle,
    '{source_url}': sourceUrl,
  };

  for (const [placeholder, value] of Object.entries(replacements)) {
    filled = filled.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
  }

  return filled;
}
