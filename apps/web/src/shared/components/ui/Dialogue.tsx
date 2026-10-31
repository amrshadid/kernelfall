import type { DialogueLine, Speaker } from '@shared/types'
import { groupLines } from '@shared/utils/text'
import type { ReactNode } from 'react'
import './Dialogue.css'

export interface DialogueProps {
  label: string
  lines: readonly DialogueLine[]
}

/**
 * The first named speaker gets a portrait header with their real term; other speakers cut in with a
 * compact block. Lines with no speaker are stage directions, never a speaker block.
 */
export function Dialogue({ label, lines }: DialogueProps) {
  const groups = groupLines(lines)
  const lead = groups.find((group) => group.speaker.name !== '')?.speaker.id
  const headerAt = groups.findIndex((group) => group.speaker.id === lead)
  return (
    <section className="kf-dialogue" aria-label={label}>
      {groups.map((group, index) => {
        const key = `${group.speaker.id}-${index}`
        const texts = group.texts.map((text, line) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: lines of a scene never reorder
          <p key={line}>{text}</p>
        ))
        if (group.speaker.name === '') {
          return (
            <div key={key} className="kf-dialogue__narration">
              {texts}
            </div>
          )
        }
        if (group.speaker.id === lead) {
          return (
            <div key={key} className="kf-dialogue__lead">
              {index === headerAt && <SpeakerHeader speaker={group.speaker} />}
              {texts}
            </div>
          )
        }
        return (
          <div key={key} className={`kf-dialogue__aside${group.speaker.avatar ? '' : ' kf-dialogue__aside--plain'}`}>
            {group.speaker.avatar}
            <div>
              <p className="kf-dialogue__name">
                <b>{group.speaker.name}</b>
                {group.speaker.term && ` · ${group.speaker.term}`}
              </p>
              {texts}
            </div>
          </div>
        )
      })}
    </section>
  )
}

function SpeakerHeader({ speaker }: { speaker: Speaker }): ReactNode {
  return (
    <div className="kf-dialogue__speaker">
      <span className="kf-dialogue__portrait">{speaker.portrait}</span>
      <div>
        <b>{speaker.name}</b>
        <span>{speaker.term}</span>
      </div>
    </div>
  )
}
