import type { PlaybackSpeed, XrayPlayback, XrayPlaybackActions } from '@features/xray/types'
import { SPEEDS } from '@features/xray/utils/storyboard'
import { Button, Icon, Segmented } from '@shared/components/ui'
import './Transport.css'

export interface TransportProps {
  playback: XrayPlayback
  actions: XrayPlaybackActions
  /** False in step mode: no Play, no speeds, only stepping. */
  animate: boolean
}

/** Nothing moves unless the player asks. */
export function Transport({ playback, actions, animate }: TransportProps) {
  const { stages, index, current, pending, playing, speed } = playback
  const last = stages.length - 1
  const playLabel = playing ? 'Pause' : 'Play'

  return (
    <fieldset className="xr__transport">
      <legend className="kf-visually-hidden">Playback</legend>
      <Button size="sm" onClick={actions.replay} disabled={index === 0 && pending === null && !playing}>
        Replay
      </Button>
      <Button size="sm" onClick={actions.back} disabled={index === 0 && pending === null} aria-label="Step back">
        <Icon name="back" />
      </Button>
      {animate ? (
        <Button size="sm" variant="primary" className="xr__play" onClick={actions.togglePlay}>
          {playLabel}
        </Button>
      ) : (
        <span className="xr__step-mode">Step mode</span>
      )}
      <Button
        size="sm"
        onClick={actions.forward}
        disabled={index >= last && pending === null}
        aria-label={pending !== null ? 'Show the next stage without guessing' : 'Step forward'}
      >
        <Icon name="forward" />
      </Button>
      {animate && (
        <div className="xr__speed">
          <Segmented
            legend="Speed"
            options={SPEEDS.map((value) => ({ value: String(value), label: `${value}×` }))}
            value={String(speed)}
            onChange={(value) => actions.setSpeed(Number(value) as PlaybackSpeed)}
          />
        </div>
      )}
      <nav className="xr__ticks" aria-label="Stages">
        {stages.map((stage, i) => (
          <button
            key={stage.key}
            type="button"
            className={i > current ? 'xr__tick--future' : undefined}
            aria-current={i === current ? 'step' : undefined}
            aria-label={`Stage ${i + 1}: ${stage.title}`}
            onClick={() => actions.goto(i)}
          >
            {stage.tick}
          </button>
        ))}
      </nav>
      <span className="xr__count" aria-live="off">
        {current + 1} / {stages.length}
      </span>
    </fieldset>
  )
}
