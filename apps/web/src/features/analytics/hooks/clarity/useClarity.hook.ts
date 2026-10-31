import { type ClarityWindow, loadClarity } from '@features/analytics/utils/clarity'
import { useEffect } from 'react'

/** An opt-out takes effect on the next page load: a tag already running is left alone. */
export function useClarity(clarityId: string | null, shareRecordings: boolean): void {
  useEffect(() => {
    if (clarityId !== null && shareRecordings) {
      loadClarity(clarityId, window as Window & ClarityWindow, document)
    }
  }, [clarityId, shareRecordings])
}
