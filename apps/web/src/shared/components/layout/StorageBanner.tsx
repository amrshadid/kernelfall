import { Banner } from '@shared/components/ui/Banner'
import { Button } from '@shared/components/ui/Button'
import type { StorageIssue } from '@shared/types'

export interface StorageBannerProps {
  issue: StorageIssue
  onExport: () => void
}

const MESSAGES: Readonly<Record<StorageIssue, string>> = {
  private: "Progress can't be saved in this window. Export your save before you close it.",
  full: "Progress couldn't be saved: the browser's storage refused it, maybe because it is full. Export your save to keep it safe.",
  unreadable: "Your saved game couldn't be read, so it was left untouched. This session isn't being saved.",
}

export function StorageBanner({ issue, onExport }: StorageBannerProps) {
  return (
    <Banner
      action={
        issue === 'unreadable' ? undefined : (
          <Button size="sm" onClick={onExport}>
            Export save
          </Button>
        )
      }
    >
      {MESSAGES[issue]}
    </Banner>
  )
}
