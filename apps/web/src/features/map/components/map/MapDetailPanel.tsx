import type { MapDetail } from '@features/map/types'
import { ButtonLink, NodeMarkIcon } from '@shared/components/ui'
import type { NodeState } from '@shared/types'
import './MapDetailPanel.css'

const LEGEND: readonly { state: NodeState; planned?: boolean; label: string }[] = [
  { state: 'locked', planned: true, label: 'Not built yet' },
  { state: 'locked', label: 'Locked' },
  { state: 'available', label: 'Available' },
  { state: 'progress', label: 'In progress' },
  { state: 'done', label: 'Done' },
  { state: 'clean', label: 'Done, no Taint' },
  { state: 'helped', label: 'Done with help' },
]

/** The side panel: everything about the selected stop, its action, and the legend of shapes. */
export function MapDetailPanel({ detail }: { detail: MapDetail }) {
  return (
    <aside className="map-detail" aria-labelledby="map-detail-h">
      <div className="map-detail__head">
        <p>{detail.place}</p>
        <h2 id="map-detail-h">{detail.title}</h2>
        <span className={`map-detail__state map-detail__state--${detail.state}`}>
          <NodeMarkIcon state={detail.state} planned={detail.planned} />
          {detail.status}
        </span>
      </div>
      <div className="map-detail__body">
        <dl>
          {detail.skills.length > 0 && (
            <div>
              <dt>Skill</dt>
              <dd>
                {detail.skills.map((skill) => (
                  <span key={skill.id} className="map-detail__skill">
                    {skill.title} <code>{skill.id}</code>
                  </span>
                ))}
              </dd>
            </div>
          )}
          <div>
            <dt>Needs</dt>
            <dd>
              {detail.needs.length === 0
                ? 'Nothing: start here'
                : detail.needs.map((need) => (
                    <span key={need.id} className="map-detail__need">
                      <code>{need.id}</code>{' '}
                      <span className={need.met ? 'map-detail__ok' : 'map-detail__missing'}>
                        {need.met ? '✓' : '✗'}
                        <span className="kf-visually-hidden">{need.met ? ' met' : ' not yet'}</span>
                      </span>
                    </span>
                  ))}
            </dd>
          </div>
          {detail.step !== null && (
            <div>
              <dt>Step</dt>
              <dd>{detail.step}</dd>
            </div>
          )}
          <div>
            <dt>Time</dt>
            <dd>{detail.time}</dd>
          </div>
          <div>
            <dt>Best Taint</dt>
            <dd>{detail.bestTaint}</dd>
          </div>
          {detail.codex.length > 0 && (
            <div>
              <dt>Codex</dt>
              <dd className="map-detail__codex">
                {detail.codex.map((card, index) => (
                  <span key={card.id}>
                    {index > 0 && ' · '}
                    <a href={card.href}>
                      <code>{card.term}</code>
                    </a>
                  </span>
                ))}
              </dd>
            </div>
          )}
        </dl>
        {detail.note !== null && <p className="map-detail__note">{detail.note}</p>}
        {detail.play && (
          <div className="map-detail__actions">
            <ButtonLink variant="primary" href={detail.play.href}>
              {detail.play.label}
            </ButtonLink>
          </div>
        )}
      </div>
      <section className="map-detail__legend" aria-labelledby="map-legend-h">
        <h3 id="map-legend-h">Legend</h3>
        <ul>
          {LEGEND.map((item) => (
            <li key={item.label}>
              <NodeMarkIcon state={item.state} planned={item.planned === true} />
              {item.label}
            </li>
          ))}
        </ul>
      </section>
    </aside>
  )
}
