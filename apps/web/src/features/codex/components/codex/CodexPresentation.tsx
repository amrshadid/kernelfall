import { FieldGuideTable } from '@features/codex/components/field-guide'
import type { CodexGroup, CodexTab, FieldGuideSection } from '@features/codex/types'
import { CodexCard } from '@shared/components/codex'
import { ManHead, ScreenFrame } from '@shared/components/layout'
import { ButtonLink, Icon, Tabs } from '@shared/components/ui'
import type { CodexCardData, ScreenChrome } from '@shared/types'
import './Codex.css'

export interface CodexSelection {
  readonly card: CodexCardData
  readonly simplified: readonly string[]
  readonly seenIn: string
  readonly filed: boolean
}

export interface CodexPresentationProps {
  chrome: ScreenChrome
  backHref: string
  filed: number
  total: number
  groups: readonly CodexGroup[]
  selectedId: string | null
  selection: CodexSelection | null
  /** The Field Guide's page; null until the level that opens it has started. */
  fieldGuide: readonly FieldGuideSection[] | null
  tab: CodexTab
  onTab: (tab: CodexTab) => void
}

const TAB_ITEMS = [
  { id: 'cards', label: 'Cards' },
  { id: 'field-guide', label: 'Field Guide' },
] as const

const isTab = (id: string): id is CodexTab => TAB_ITEMS.some((item) => item.id === id)

export function CodexPresentation({
  chrome,
  backHref,
  filed,
  total,
  groups,
  selectedId,
  selection,
  fieldGuide,
  tab,
  onTab,
}: CodexPresentationProps) {
  return (
    <ScreenFrame
      page="Kernelfall-codex(7)"
      volume="Kernelfall Service Manual · The Codex"
      chrome={chrome}
      topbar={
        <nav className="screen__topbar" aria-label="Codex">
          <ButtonLink href={backHref} variant="quiet">
            <Icon name="back" />
            Title
          </ButtonLink>
          <h1 tabIndex={-1} className="codex-title">
            Codex
          </h1>
          {fieldGuide !== null && (
            <Tabs
              label="Codex pages"
              idPrefix="codex-tab"
              items={TAB_ITEMS}
              selected={tab}
              onSelect={(id) => isTab(id) && onTab(id)}
            />
          )}
          <p className="codex-count">
            {filed} of {total} cards filed
          </p>
        </nav>
      }
      foot={<ManHead kind="foot" left={`${filed} / ${total}`} center="Kernelfall 0.1" right="Linux 6.18" />}
    >
      {tab === 'field-guide' && fieldGuide !== null ? (
        <main
          className="screen__sheet kf-sheet"
          id="codex-panel-field-guide"
          role="tabpanel"
          aria-labelledby="codex-tab-field-guide"
        >
          <FieldGuideTable sections={fieldGuide} />
        </main>
      ) : (
        <CardsPage groups={groups} selectedId={selectedId} selection={selection} />
      )}
    </ScreenFrame>
  )
}

function CardsPage({
  groups,
  selectedId,
  selection,
}: Pick<CodexPresentationProps, 'groups' | 'selectedId' | 'selection'>) {
  return (
    <main className="codex screen__sheet kf-sheet">
      <nav className="codex__index" aria-label="Codex cards">
        {groups.map((group) => (
          <section key={group.key} aria-label={group.name}>
            <h2>{group.name}</h2>
            <ul>
              {group.entries.map((entry) => (
                <li key={entry.id}>
                  <a
                    href={entry.href}
                    aria-current={entry.id === selectedId ? 'page' : undefined}
                    className={`codex__entry codex__entry--${entry.state}`}
                  >
                    <code>{entry.term}</code>
                    <span>{entry.state === 'filed' ? 'filed' : 'seen'}</span>
                  </a>
                </li>
              ))}
            </ul>
            {group.hidden > 0 && (
              <p className="codex__hidden">
                {group.hidden} card{group.hidden === 1 ? '' : 's'} to find
              </p>
            )}
          </section>
        ))}
      </nav>
      <div className="codex__page">
        {selection ? (
          <>
            {!selection.filed && (
              <p className="codex__note">
                You've met this one in {selection.seenIn}. It's filed when you finish the level.
              </p>
            )}
            <CodexCard card={selection.card} simplified={selection.simplified} seenIn={selection.seenIn} />
          </>
        ) : (
          <div className="codex__empty">
            <h2>No card here yet.</h2>
            <p>
              Cards are filed as you finish levels. Each one is a real term, the kernel source file behind it, and a way
              to try it on real Linux.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
