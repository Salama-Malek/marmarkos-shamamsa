import { useState, useCallback } from 'react';
import { usePreventRemove, type NavigationAction } from '@react-navigation/native';

export interface UnsavedChangesGuard {
  pendingAction: NavigationAction | null;
  confirmDiscard: (dispatch: (action: NavigationAction) => void) => void;
  cancelDiscard: () => void;
}

/**
 * Blocks navigation away from a screen while `hasUnsavedChanges` is true,
 * so the caller can render a confirmation modal. Confirm discards changes;
 * cancel returns to the form.
 */
export function useUnsavedChangesGuard(hasUnsavedChanges: boolean): UnsavedChangesGuard {
  const [pendingAction, setPendingAction] = useState<NavigationAction | null>(null);

  usePreventRemove(hasUnsavedChanges, ({ data }) => {
    setPendingAction(data.action);
  });

  const confirmDiscard = useCallback(
    (dispatch: (action: NavigationAction) => void) => {
      const action = pendingAction;
      setPendingAction(null);
      if (action) dispatch(action);
    },
    [pendingAction],
  );

  const cancelDiscard = useCallback(() => {
    setPendingAction(null);
  }, []);

  return { pendingAction, confirmDiscard, cancelDiscard };
}
