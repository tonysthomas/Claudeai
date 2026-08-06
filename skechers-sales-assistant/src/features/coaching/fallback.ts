// Fallback: map the Phase 9 deterministic guidance into the coach response shape.
// Used when no AI provider is configured (production) or when the provider fails,
// times out, or trips a guardrail. This guarantees the associate always gets
// safe, approved, stored guidance — never a broken or hallucinated result.
import type { GuidanceContent } from '../guidance/types';
import type { CoachResponse, CoachSection } from './types';

export function guidanceToCoachResponse(guidance: GuidanceContent, reason: string): CoachResponse {
  const sections: CoachSection[] = [
    { key: 'discovery', title: 'Open the conversation', body: guidance.discovery_question },
    {
      key: 'feature_benefit',
      title: 'Feature → benefit',
      body: `${guidance.customer_friendly_explanation} ${guidance.customer_benefit}`,
    },
    {
      key: 'objection',
      title: 'Handle the concern',
      body: `If they say ${guidance.common_objection} — ${guidance.suggested_response}`,
    },
    { key: 'closing', title: 'Ask for the close', body: guidance.closing_question },
  ];
  return { sections, grounded: true, source: 'fallback_template', provider: 'phase9-template', fallbackReason: reason };
}
