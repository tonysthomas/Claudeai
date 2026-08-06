// Fallback: map the Phase 9 deterministic guidance into the coach response shape.
// Used when no AI provider is configured (production) or when the provider fails,
// times out, or trips a guardrail. This guarantees the associate always gets
// safe, approved, stored guidance — never a broken or hallucinated result.
import type { GuidanceContent } from '../guidance/types';
import type { CoachAnswer, CoachIntent, CoachResponse, CoachSection } from './types';

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

/**
 * Build a safe fallback ANSWER from the Phase 9 guidance, selecting the most
 * relevant approved snippet for the inferred intent. Used when the AI answer
 * fails or trips a guardrail.
 */
export function guidanceToAnswer(
  guidance: GuidanceContent,
  question: string,
  intent: CoachIntent,
  reason: string,
): CoachAnswer {
  let body: string;
  switch (intent) {
    case 'discovery':
      body = guidance.discovery_question;
      break;
    case 'closing':
      body = guidance.closing_question;
      break;
    case 'price_objection':
    case 'style_objection':
    case 'fit_objection':
      body = `If they say ${guidance.common_objection} — ${guidance.suggested_response}`;
      break;
    case 'feature_benefit':
    case 'comparison':
    case 'add_on':
    case 'general':
    default:
      body = `${guidance.customer_friendly_explanation} ${guidance.customer_benefit}`;
      break;
  }
  return {
    question,
    answer: body,
    intent,
    grounded: true,
    source: 'fallback_template',
    provider: 'phase9-template',
    fallbackReason: reason,
  };
}
