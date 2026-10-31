import { kernelSourceUrl } from '@kernelfall/machine/utils'
import { Button, ManPage } from '@shared/components/ui'
import type { CodexCardData, ManPageSection } from '@shared/types'
import { useState } from 'react'
import './CodexCard.css'

export interface CodexCardProps {
  card: CodexCardData
  /** Where the level simplifies, from its `fidelity` block; shown honestly on the card. */
  simplified?: readonly string[]
  /** "Act I · 1.4 Run Anything", the level that filed the card. */
  seenIn?: string
  stamp?: { readonly label: string; readonly note?: string }
}

const COPIED_FOR_MS = 1600

export function CodexCard({ card, simplified = [], seenIn, stamp }: CodexCardProps) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(card.tryIt)
      setCopied(true)
      window.setTimeout(() => setCopied(false), COPIED_FOR_MS)
    } catch {
      setCopied(false)
    }
  }

  const sections: ManPageSection[] = [
    { name: 'Name', body: <code>{card.term}</code> },
    { name: 'Description', body: card.summary },
    ...(card.sources.length > 0
      ? [
          {
            name: 'Source',
            body: (
              <span className="codex-card__sources">
                {card.sources.map((path) => (
                  <a key={path} href={kernelSourceUrl(path)} target="_blank" rel="noreferrer">
                    <code>{path}</code>
                  </a>
                ))}
              </span>
            ),
          },
        ]
      : []),
    {
      name: 'Try it on real Linux',
      body: (
        <div className="codex-card__try">
          <pre>{card.tryIt}</pre>
          <Button size="sm" onClick={copy}>
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      ),
    },
    {
      name: 'See also',
      body: (
        <a href={card.docs} target="_blank" rel="noreferrer">
          {card.docs.replace(/^https:\/\//, '')}
        </a>
      ),
    },
  ]
  if (simplified.length > 0) {
    sections.push({
      name: 'Simplified here',
      body: (
        <ul className="codex-card__list">
          {simplified.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ),
    })
  }
  if (seenIn !== undefined) {
    sections.push({ name: 'Filed in', body: seenIn })
  }
  return (
    <ManPage
      title={card.term}
      source="Kernelfall Codex"
      sections={sections}
      headingId={`codex-${card.id}`}
      {...(stamp ? { stamp } : {})}
    />
  )
}
