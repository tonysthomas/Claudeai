// Guardrails for AI Sales Coach output. Two checks:
//   1. Prohibited-claims: reject medical / health / therapeutic / biomechanical
//      language (e.g. "cures plantar fasciitis", "prevents injury").
//   2. Grounding: any product name / technology the coach mentions must appear
//      in the approved grounding context — the coach may rephrase facts but must
//      not introduce new ones.
// A failing check makes the service fall back to the deterministic templates.
import type { CoachAnswer, CoachContext, CoachResponse } from './types';

/** Medical / health / biomechanical terms the coach must never use. */
export const PROHIBITED_TERMS: string[] = [
  'cure', 'cures', 'heal', 'heals', 'treat', 'treats', 'treatment', 'therapy',
  'therapeutic', 'medical', 'medicinal', 'diagnos', 'prevent injury', 'prevents injury',
  'injury prevention', 'plantar fasciitis', 'arthritis', 'diabet', 'tendonitis',
  'bunion', 'orthopedic', 'orthopaedic', 'orthotic', 'clinically', 'doctor recommended',
  'pain relief', 'relieves pain', 'reduces pain', 'corrects posture', 'realign',
  'realigns', 'chronic', 'inflammation', 'rehabilitat',
];

export interface GuardrailResult {
  ok: boolean;
  violations: string[];
}

/** Check a single block of text for prohibited medical/health claims. */
export function checkProhibitedClaims(text: string): GuardrailResult {
  const lower = text.toLowerCase();
  const violations = PROHIBITED_TERMS.filter((term) => lower.includes(term));
  return { ok: violations.length === 0, violations };
}

/**
 * Check that the text stays grounded: every product name and technology token it
 * references must exist in the approved context. This is a conservative check —
 * it flags a response that names a technology not present in the context.
 */
export function checkGrounding(text: string, ctx: CoachContext): GuardrailResult {
  const allowedTech = [ctx.selected.technology, ctx.recommended.technology]
    .filter((t): t is string => !!t)
    .map((t) => t.toLowerCase());

  // Collect any capitalized "Demo …" technology-style phrase the coach may have
  // emitted, and ensure it is one of the approved technologies.
  const mentioned = [...text.matchAll(/Demo [A-Z][A-Za-z ]+?(?= (?:is|are|gives|adds|helps|keeps|offers|means|for|to|and|\.|,))/g)]
    .map((m) => m[0].toLowerCase().trim());

  const violations = mentioned.filter(
    (m) => !allowedTech.some((t) => t.includes(m) || m.includes(t)) &&
      !ctx.selected.name.toLowerCase().includes(m) &&
      !ctx.recommended.name.toLowerCase().includes(m),
  );
  return { ok: violations.length === 0, violations: [...new Set(violations)] };
}

/** Validate a full coach response: prohibited-claims + grounding on every section. */
export function validateCoachResponse(response: CoachResponse, ctx: CoachContext): GuardrailResult {
  const violations: string[] = [];
  for (const s of response.sections) {
    violations.push(...checkProhibitedClaims(s.body).violations);
    violations.push(...checkGrounding(s.body, ctx).violations);
  }
  return { ok: violations.length === 0, violations: [...new Set(violations)] };
}

/** Validate a single free-text answer: prohibited-claims + grounding. */
export function validateCoachAnswer(answer: CoachAnswer, ctx: CoachContext): GuardrailResult {
  const violations = [
    ...checkProhibitedClaims(answer.answer).violations,
    ...checkGrounding(answer.answer, ctx).violations,
  ];
  return { ok: violations.length === 0, violations: [...new Set(violations)] };
}
