import type { LevelCard } from '@features/level/types'
import { CodexCard } from '@shared/components/codex'
import { Button } from '@shared/components/ui'
import './CardOverlay.css'

export interface CardOverlayProps {
  card: LevelCard
}

/** Each card feeds out this much after the one before it. */
const FEED_STAGGER_MS = 120

export function CardOverlay({ card }: CardOverlayProps) {
  return (
    <section className="level-card" aria-labelledby="level-card-h">
      <header className="level-card__head">
        <h2 id="level-card-h">{card.headline}</h2>
        <p>{card.result}</p>
        <div className="level-card__actions">
          {card.next && (
            <Button variant="primary" onClick={card.next.onSelect}>
              {card.next.label}
            </Button>
          )}
          <Button onClick={card.onReplay}>Replay level</Button>
          <Button variant={card.next ? 'default' : 'primary'} onClick={card.onMap}>
            Back to map
          </Button>
        </div>
      </header>
      <div className="level-card__cards">
        {card.cards.map((data, index) => (
          <div key={data.id} className="level-card__feed" style={{ animationDelay: `${index * FEED_STAGGER_MS}ms` }}>
            <CodexCard
              card={data}
              simplified={index === 0 ? card.simplified : []}
              seenIn={card.seenIn}
              stamp={{ label: 'Filed', note: `Codex · ${card.seenIn}` }}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
