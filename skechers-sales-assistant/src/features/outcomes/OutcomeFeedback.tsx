// Container: owns the selected outcome + save status for one recommendation and
// writes the event (non-blocking) with the session associate/store (anonymous in
// DEMO_MODE). The associate can change the outcome before the next scan.
import { useCallback, useState } from 'react';
import { logRecommendationOutcome } from '../../lib/recommendations';
import { useAuth } from '../auth/AuthContext';
import type { CustomerNeed, Product } from '../../types/db';
import { OutcomeActionBar, type OutcomeStatus } from './OutcomeActionBar';
import type { OutcomeAction } from './types';

interface Props {
  selected: Product;
  recommended: Product;
  relationshipId: string | null;
  need: CustomerNeed;
}

export function OutcomeFeedback({ selected, recommended, relationshipId, need }: Props) {
  const { isDemo, userId, store } = useAuth();
  const [action, setAction] = useState<OutcomeAction | null>(null);
  const [status, setStatus] = useState<OutcomeStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const onAction = useCallback(
    (next: OutcomeAction) => {
      // Optimistic, non-blocking: reflect the choice immediately, log in the background.
      setAction(next);
      setStatus('saving');
      setErrorMessage(undefined);
      void logRecommendationOutcome({
        selected,
        recommended,
        relationshipId,
        needId: need.id,
        associateId: isDemo ? null : userId,
        storeId: isDemo ? null : store?.id ?? null,
        action: next,
      })
        .then(({ error }) => {
          setStatus(error ? 'error' : 'saved');
          setErrorMessage(error ?? undefined);
        })
        .catch((e: unknown) => {
          setStatus('error');
          setErrorMessage(e instanceof Error ? e.message : String(e));
        });
    },
    [selected, recommended, relationshipId, need, isDemo, userId, store],
  );

  return <OutcomeActionBar selected={action} status={status} onAction={onAction} errorMessage={errorMessage} />;
}
