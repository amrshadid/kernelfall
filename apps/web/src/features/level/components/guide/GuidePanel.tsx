import type { LevelGuide } from '@features/level/types'
import { speakerOf } from '@features/level/utils/speakers'
import { Button, Checklist, Chip, Dialogue, InlineText, SectionHead } from '@shared/components/ui'
import './GuidePanel.css'
import { speakerWithPortraits } from './Portraits'

export interface GuidePanelProps {
  guide: LevelGuide
}

export function GuidePanel({ guide }: GuidePanelProps) {
  const passing = guide.objectives.filter((objective) => objective.passed).length
  return (
    <aside className="level-guide" aria-label="Guide" id="level-guide" tabIndex={-1}>
      <div className="level-guide__body">
        {guide.reviewNote !== null && <p className="level-guide__review">{guide.reviewNote}</p>}
        {guide.placement !== null && (
          <aside className="level-guide__placement" aria-label="Placement check">
            <p>
              <strong>init:</strong> <InlineText text={guide.placement.offer} />
            </p>
            <a href={guide.placement.href}>Take the placement check (about {guide.placement.minutes} minutes)</a>
          </aside>
        )}
        {guide.lines.length > 0 && (
          <Dialogue
            label={`${guide.stepLabel}: transcript`}
            lines={guide.lines.map((line) => ({
              speaker: speakerWithPortraits(speakerOf(line.speaker)),
              text: <InlineText text={line.text} />,
            }))}
          />
        )}
        {guide.code.map((block) => (
          <pre key={block} className="level-guide__code">
            {block}
          </pre>
        ))}

        {guide.showObjectives && (
          <section aria-labelledby="level-objectives-h">
            <SectionHead id="level-objectives-h" aside={`${passing} of ${guide.objectives.length} pass`}>
              Objectives
            </SectionHead>
            <Checklist
              items={guide.objectives.map((objective) => ({
                id: objective.id,
                passed: objective.passed,
                text: <InlineText text={objective.text} />,
              }))}
            />
          </section>
        )}

        {guide.chips.length > 0 && (
          <section aria-labelledby="level-commands-h" className="level-guide__commands">
            <SectionHead id="level-commands-h">Commands to try</SectionHead>
            <ul>
              {guide.chips.map((chip) => (
                <li key={chip.command}>
                  {chip.onRun ? (
                    <button
                      type="button"
                      className="level-guide__command"
                      onClick={chip.onRun}
                      aria-label={`Run ${chip.command}`}
                    >
                      {chip.command}
                    </button>
                  ) : (
                    <code className="level-guide__command level-guide__command--name">{chip.command}</code>
                  )}
                  <span>{chip.explain}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {guide.checkReport !== null && (
          <section aria-labelledby="level-check-h" className="level-guide__check" aria-live="polite">
            <SectionHead id="level-check-h" aside={guide.checkReport.heading}>
              Still missing
            </SectionHead>
            {guide.checkReport.missing.length > 0 ? (
              <ul>
                {guide.checkReport.missing.map((text) => (
                  <li key={text}>
                    <InlineText text={text} />
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nothing. Every objective passed.</p>
            )}
            {guide.checkReport.taint.length > 0 && (
              <ul className="level-guide__check-taint" aria-label="Taint">
                {guide.checkReport.taint.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            )}
            {guide.checkReport.held !== null && (
              <p className="level-guide__check-held">
                <strong>init:</strong> <InlineText text={guide.checkReport.held} />
              </p>
            )}
          </section>
        )}

        {guide.hints.length > 0 && (
          <section aria-labelledby="level-hints-h" className="level-guide__hints">
            <SectionHead id="level-hints-h" aside="never Taint">
              init's hints
            </SectionHead>
            <ol>
              {guide.hints.map((hint, index) => (
                <li key={hint.tier}>
                  <span className="level-guide__hint-tier">
                    Hint {index + 1}, {hint.tier}
                  </span>
                  <InlineText text={hint.text} />
                </li>
              ))}
            </ol>
          </section>
        )}

        {guide.note !== null && <p className="level-guide__note">{guide.note}</p>}

        {guide.seeAlso.length > 0 && (
          <section aria-labelledby="level-see-also-h" className="level-guide__see-also">
            <SectionHead id="level-see-also-h">See also</SectionHead>
            <p>
              {guide.seeAlso.map((page, index) => (
                <span key={page.term}>
                  {index > 0 && ', '}
                  <a href={page.href} target="_blank" rel="noreferrer">
                    <code>{page.term}</code>
                  </a>
                </span>
              ))}
            </p>
          </section>
        )}

        {guide.codex.length > 0 && (
          <section aria-labelledby="level-codex-h">
            <SectionHead id="level-codex-h">Codex</SectionHead>
            <p className="level-guide__chips">
              {guide.codex.map((card) => (
                <Chip key={card.id} href={card.href}>
                  {card.term}
                </Chip>
              ))}
            </p>
          </section>
        )}
      </div>
      {guide.actions.length > 0 && (
        <div className="level-guide__actions">
          {guide.actions.map((action) => (
            <Button key={action.id} variant={action.kind} onClick={action.onSelect}>
              {action.label}
              {action.keys !== undefined && <kbd>{action.keys}</kbd>}
            </Button>
          ))}
        </div>
      )}
    </aside>
  )
}
