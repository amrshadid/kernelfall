import type { LevelRecall } from '@features/level/types'
import { MapOverview } from '@features/map/components/map'
import { InlineText } from '@shared/components/ui'
import { useState } from 'react'

export interface RecallDeckProps {
  recall: LevelRecall
}

type Face = 'turned' | 'knew' | 'missed'

const MARKS: Readonly<Record<Exclude<Face, 'turned'>, string>> = {
  knew: 'I knew it',
  missed: 'Comes back sooner',
}

/** Cards from earlier levels, face down: the player says the answer, turns the card and marks it themselves. */
export function RecallDeck({ recall }: RecallDeckProps) {
  const [faces, setFaces] = useState<Readonly<Record<string, Face>>>({})
  const mark = (cardId: string, knew: boolean) => {
    setFaces((current) => ({ ...current, [cardId]: knew ? 'knew' : 'missed' }))
    recall.onMark(cardId, knew)
  }
  return (
    <section className="level-recall" aria-labelledby="level-recall-h">
      <header className="level-recall__head">
        <h3 id="level-recall-h">{recall.title}</h3>
        <p>{recall.note}</p>
      </header>
      {recall.drawing && (
        <figure className="level-recall__drawing">
          <div className="level-recall__map">
            <MapOverview
              layers={recall.drawing.layers}
              description={recall.drawing.description}
              href={null}
              pulse={false}
            />
          </div>
          <figcaption>{recall.drawing.caption}</figcaption>
        </figure>
      )}
      <ol className="level-recall__cards">
        {recall.cards.map((card) => {
          const face = faces[card.id]
          return (
            <li key={card.id} className={`level-recall__card${face ? ' level-recall__card--turned' : ''}`}>
              <p className="level-recall__term">
                <InlineText text={card.term} />
                <span className="level-recall__seen">{card.seenIn}</span>
              </p>
              {face === undefined ? (
                <button
                  type="button"
                  className="level-recall__turn"
                  onClick={() => setFaces((current) => ({ ...current, [card.id]: 'turned' }))}
                >
                  Turn the card
                </button>
              ) : (
                <>
                  <p className="level-recall__answer">
                    <InlineText text={card.answer} />
                  </p>
                  {face === 'turned' ? (
                    <div className="level-recall__marks">
                      <button type="button" onClick={() => mark(card.id, true)}>
                        I knew it
                      </button>
                      <button type="button" onClick={() => mark(card.id, false)}>
                        Not yet
                      </button>
                    </div>
                  ) : (
                    <p className={`level-recall__mark level-recall__mark--${face}`}>{MARKS[face]}</p>
                  )}
                </>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
