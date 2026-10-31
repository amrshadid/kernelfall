import {
  BootDrawing,
  CpuLanesDrawing,
  ProcessDrawing,
  RouteDrawing,
  SectionDrawing,
  SyscallDrawing,
} from '@features/xray/components/drawing'
import { StraceLog } from '@features/xray/components/log'
import type {
  ProcessScene,
  SyscallScene,
  XrayBoardActions,
  XrayControls,
  XrayFigure,
  XrayPlayback,
  XrayPlaybackActions,
} from '@features/xray/types'
import { STAGE_MS, transcriptOf } from '@features/xray/utils/storyboard'
import { InlineText, Segmented } from '@shared/components/ui'
import type { CSSProperties, KeyboardEvent } from 'react'
import { CallList } from './CallList'
import { Narration } from './Narration'
import { Predict } from './Predict'
import { Transcript } from './Transcript'
import { Transport } from './Transport'
import './XrayBoard.css'

export interface XrayBoardProps {
  /** `dock` stacks everything in the level's X-ray column; `sheet` is the full-size drawing board. */
  layout: 'dock' | 'sheet'
  controls: XrayControls
  controlActions: XrayBoardActions
  figure: XrayFigure | null
  /** Shown instead of a drawing: nothing has run yet, or the run has nothing for this view. */
  emptyText: string | null
  /** The figure's caption, e.g. "Fig. 1. write(1, "hello\n", 6), end to end." */
  caption: string
  playback: XrayPlayback
  playbackActions: XrayPlaybackActions
  /** False in step mode (reduced motion): no timer, no animation. */
  animate: boolean
}

const EXPAND_PATH = 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5'
const CLOSE_PATH = 'M6 6l12 12M18 6 6 18'

// Keys that drive playback from anywhere in the board, except where a control needs them.
function onBoardKey(event: KeyboardEvent<HTMLDivElement>, actions: XrayPlaybackActions, animate: boolean): void {
  const target = event.target as HTMLElement
  if (target.closest('select, input, textarea')) {
    return
  }
  if (event.key === ' ' && animate && !target.closest('button, a, summary')) {
    event.preventDefault()
    actions.togglePlay()
  } else if (event.key === 'ArrowRight' && !target.closest('[role="tablist"], .xr__ticks')) {
    event.preventDefault()
    actions.forward()
  } else if (event.key === 'ArrowLeft' && !target.closest('[role="tablist"], .xr__ticks')) {
    event.preventDefault()
    actions.back()
  }
}

export function XrayBoard({
  layout,
  controls,
  controlActions,
  figure,
  emptyText,
  caption,
  playback,
  playbackActions,
  animate,
}: XrayBoardProps) {
  const stage = playback.stages[playback.index]
  const pendingStage = playback.pending !== null ? playback.stages[playback.pending] : undefined
  const label = stage ? `${caption} Stage ${playback.index + 1}: ${stage.title}` : caption
  const classes = ['xr', animate && 'xr--animate', playback.playing && 'xr--playing'].filter(Boolean).join(' ')
  const style = { '--xr-stage': `${STAGE_MS / playback.speed}ms` } as CSSProperties

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: playback keys work from anywhere inside the board
    <div
      className={classes}
      data-depth={controls.depth}
      data-speed={playback.speed}
      style={style}
      onKeyDown={(event) => onBoardKey(event, playbackActions, animate)}
    >
      <div className="xr__bar">
        <h2 className="xr__title">X-ray</h2>
        {controls.lenses.length > 1 && (
          <Segmented
            legend="View"
            options={controls.lenses.map((lens) => ({ value: lens.id, label: lens.label }))}
            value={controls.lens}
            onChange={controlActions.setLens}
          />
        )}
        <div className="xr__bar-end">
          <Segmented
            legend="Depth"
            showLegend={false}
            options={[
              { value: 'simple', label: 'Simple' },
              { value: 'deep', label: 'Deep' },
            ]}
            value={controls.depth}
            onChange={controlActions.setDepth}
          />
          <button
            type="button"
            className="xr__icon-btn"
            aria-label={layout === 'sheet' ? 'Close the full-size drawing' : 'Open the full-size drawing'}
            onClick={() => controlActions.setExpanded(layout !== 'sheet')}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={layout === 'sheet' ? CLOSE_PATH : EXPAND_PATH} />
            </svg>
          </button>
        </div>
      </div>

      {controls.runs.length > 0 && (
        <div className="xr__run">
          <label>
            Run
            <select
              value={controls.runId ?? ''}
              onChange={(event) => controlActions.selectRun(Number(event.target.value))}
            >
              {controls.runs.map((run) => (
                <option key={run.id} value={run.id}>
                  $ {run.label}
                </option>
              ))}
            </select>
          </label>
          <label className="xr__predict-toggle">
            <input
              type="checkbox"
              checked={controls.predict}
              onChange={(event) => controlActions.setPredict(event.target.checked)}
            />
            Predict first
          </label>
          {controls.callList === null && controls.picks.length > 1 && (
            <fieldset className="xr__picks">
              <legend className="kf-visually-hidden">{controls.pickLegend}</legend>
              {controls.picks.map((pick) => (
                <button
                  key={pick.id}
                  type="button"
                  aria-pressed={pick.id === controls.pickId}
                  onClick={() => controlActions.select(pick.id)}
                >
                  {pick.label}
                </button>
              ))}
            </fieldset>
          )}
        </div>
      )}

      {controls.callList !== null && controls.callList.groups.length > 0 && (
        <CallList
          view={controls.callList}
          selectedId={controls.pickId !== null ? Number(controls.pickId) : null}
          onSelect={(id) => controlActions.select(String(id))}
          onToggle={controlActions.toggleRow}
        />
      )}

      {figure !== null && figure.kind !== 'syscalls' && figure.kind !== 'processes' ? (
        <figure className="xr__drawing">
          {figure.kind === 'section' && <SectionDrawing view={figure.view} />}
          {figure.kind === 'route' && <RouteDrawing view={figure.view} />}
          {figure.kind === 'cpus' && <CpuLanesDrawing view={figure.view} />}
          {figure.kind === 'boot' && <BootDrawing view={figure.view} />}
          <figcaption className="xr__caption">
            <span>
              <InlineText text={caption} />
            </span>
          </figcaption>
        </figure>
      ) : figure === null || stage === undefined ? (
        <div className="xr__empty">
          <p>
            <InlineText text={emptyText ?? 'Nothing to draw yet.'} />
          </p>
        </div>
      ) : (
        <>
          <figure className="xr__drawing">
            {figure.kind === 'syscalls' ? (
              <SyscallDrawing
                storyboard={figure.storyboard}
                scene={stage.scene as SyscallScene}
                depth={controls.depth}
                label={label}
              />
            ) : (
              figure.kind === 'processes' && (
                <ProcessDrawing storyboard={figure.storyboard} scene={stage.scene as ProcessScene} label={label} />
              )
            )}
            <figcaption className="xr__caption">
              <span>{caption}</span>
              <span>{animate ? 'Space plays · ← → step' : '← → step'}</span>
            </figcaption>
          </figure>
          <Transport playback={playback} actions={playbackActions} animate={animate} />
          <div className="xr__side">
            {pendingStage?.predict && (
              <Predict
                predict={pendingStage.predict}
                picked={playback.pendingGuess}
                onPick={playbackActions.guess}
                onWatch={playbackActions.reveal}
              />
            )}
            <Narration
              stage={stage}
              index={playback.index}
              count={playback.stages.length}
              guessNext={playback.pending !== null}
              guess={playback.shownGuess}
              depth={controls.depth}
            />
            <div className="xr__more">
              {controls.log && (
                <details>
                  <summary>Sequence (strace)</summary>
                  <StraceLog
                    runs={[controls.log]}
                    focusId={Number(controls.pickId)}
                    onSelect={(id) => controlActions.select(String(id))}
                    animate={animate}
                  />
                </details>
              )}
              <Transcript entries={transcriptOf(playback.stages)} current={playback.index} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
