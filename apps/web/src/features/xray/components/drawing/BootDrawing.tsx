import type { BootStageView, BootView } from '@features/xray/types'
import { BOOT_STAGE_LINES, dmesgLine } from '@features/xray/utils/boot'
import { InlineText } from '@shared/components/ui'
import type { CSSProperties } from 'react'
import './BootDrawing.css'

export interface BootDrawingProps {
  view: BootView
}

const seconds = (time: number) => `${time.toFixed(6)} s`

function BootStage({ stage, number, params }: { stage: BootStageView; number: number; params: BootView['params'] }) {
  const shown = stage.lines.slice(0, BOOT_STAGE_LINES)
  const folded = stage.lines.slice(BOOT_STAGE_LINES)
  return (
    <li className={`xr-boot__stage${stage.failed ? ' xr-boot__stage--failed' : ''}`}>
      <span className="xr-boot__balloon" aria-hidden="true">
        {number}
      </span>
      <div className="xr-boot__body">
        <h3 className="xr-boot__title">
          <span>{stage.title}</span>
          <span className="xr-boot__time">
            {stage.time === null ? 'from /proc/mounts' : `t = ${seconds(stage.time)}`}
          </span>
        </h3>
        <p className="xr-boot__note">
          <InlineText text={stage.note} />
        </p>
        {stage.kind === 'cmdline' && params.length > 0 && (
          <ul className="xr-boot__params" aria-label="Kernel arguments">
            {params.map((param, at) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: an argument may repeat; the line never reorders
              <li key={at} className={param.unknown ? 'xr-boot__param--unknown' : undefined}>
                <code>{param.text}</code>
                {param.unknown && <span className="kf-visually-hidden"> (unknown to the kernel)</span>}
              </li>
            ))}
          </ul>
        )}
        {shown.length > 0 && <pre className="xr-boot__lines">{shown.map(dmesgLine).join('\n')}</pre>}
        {folded.length > 0 && (
          <details className="xr-boot__more">
            <summary>
              {folded.length} more {folded.length === 1 ? 'line' : 'lines'}
            </summary>
            <pre className="xr-boot__lines">{folded.map(dmesgLine).join('\n')}</pre>
          </details>
        )}
      </div>
    </li>
  )
}

/** The boot as a drawing: a time scale, then each stage the kernel logged, numbered in the order it happened. */
export function BootDrawing({ view }: BootDrawingProps) {
  return (
    <div className="xr-boot">
      <div className="xr-boot__ruler" aria-hidden="true">
        <div className="xr-boot__scale">
          {view.marks.map((mark) => (
            <span
              key={mark.number}
              className={`xr-boot__tick${mark.failed ? ' xr-boot__tick--failed' : ''}`}
              style={{ '--at': mark.at } as CSSProperties}
            >
              {mark.labelled && <span className="xr-boot__tick-label">{mark.number}</span>}
            </span>
          ))}
        </div>
        <div className="xr-boot__ends">
          <span>0 s</span>
          <span>{seconds(view.end)}</span>
        </div>
      </div>
      <ol className="xr-boot__stages">
        {view.stages.map((stage, index) => (
          <BootStage key={stage.kind} stage={stage} number={index + 1} params={view.params} />
        ))}
      </ol>
      <details className="xr-boot__log">
        <summary>Full kernel log (dmesg, {view.log.length} lines)</summary>
        <pre className="xr-boot__lines">{view.log.map(dmesgLine).join('\n')}</pre>
      </details>
    </div>
  )
}
