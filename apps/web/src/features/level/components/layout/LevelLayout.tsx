import { CardOverlay } from '@features/level/components/card'
import { GuidePanel } from '@features/level/components/guide'
import { useHeaderWidth } from '@features/level/hooks/layout'
import type { LevelLayoutModel } from '@features/level/types'
import { ScreenFrame, Splitter, StatusBar } from '@shared/components/layout'
import { Dialog } from '@shared/components/modals'
import { Button, TitleBlock } from '@shared/components/ui'
import { limitsAtLeast } from '@shared/utils/layout'
import { PANEL_LIMITS } from '@shared/utils/settings'
import type { CSSProperties } from 'react'
import { LevelTopBar } from './LevelTopBar'
import './LevelLayout.css'

export type LevelLayoutProps = LevelLayoutModel

/** How far one arrow key moves a divider: a rem for the side panels, five percent for the split. */
const WIDTH_STEP_REM = 1
const SPLIT_STEP_PERCENT = 5
const PERCENT = 100

const remPx = () => Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
const widthOf = (id: string) => (document.getElementById(id)?.getBoundingClientRect().width ?? 0) / remPx()
const heightOf = (id: string) => document.getElementById(id)?.getBoundingClientRect().height ?? 0
const editorShare = () => (heightOf('level-editor') / Math.max(1, heightOf('level-workspace'))) * PERCENT
const percentPx = () => heightOf('level-workspace') / PERCENT

/** Each step changes emphasis, never the layout itself. */
export function LevelLayout({
  chrome,
  page,
  volume,
  bar,
  guide,
  panels,
  slots,
  terminalLabel,
  terminalStatus,
  titleBlock,
  card,
  taintReport,
  reference,
  replay,
  status,
  panelSizes,
}: LevelLayoutProps) {
  const columns = panels.xray ? 'level-work--with-xray' : 'level-work--no-xray'
  const { sizes, onResize } = panelSizes
  // Map, Replay and the title sit over the Guide, so it never gets narrower than they are.
  const guideLimits = limitsAtLeast(PANEL_LIMITS.guide, useHeaderWidth('.level-topbar__name', 'level-guide'))
  // Only sizes the player chose are set; otherwise each screen width keeps its own default.
  const sizeVars = {
    '--guide-min': `${guideLimits.min}rem`,
    ...(sizes.guide === null ? {} : { '--guide-w': `${sizes.guide}rem` }),
    ...(sizes.xray === null ? {} : { '--xray-w': `${sizes.xray}rem` }),
    ...(sizes.editor === null ? {} : { '--editor-share': `${sizes.editor}%` }),
  } as CSSProperties
  return (
    <ScreenFrame
      page={page}
      volume={volume}
      chrome={chrome}
      topbar={
        <>
          <a className="level-skip" href="#level-workspace">
            Skip to the workspace
          </a>
          <LevelTopBar bar={bar} onMenu={status.onShortcuts} />
        </>
      }
      foot={
        <StatusBar
          save={status.save}
          savedAgoMs={status.savedAgoMs}
          items={[status.machine]}
          end={
            <button type="button" className="level-status__shortcuts" onClick={status.onShortcuts}>
              Shortcuts <kbd>?</kbd>
            </button>
          }
        />
      }
    >
      <main className={`level-work screen__sheet kf-sheet ${columns} level-work--${panels.emphasis}`} style={sizeVars}>
        <GuidePanel guide={guide} />
        <Splitter
          label="Resize the Guide"
          orientation="vertical"
          direction={1}
          limits={guideLimits}
          step={WIDTH_STEP_REM}
          value={sizes.guide}
          measure={() => widthOf('level-guide')}
          pxPerUnit={remPx}
          onResize={(size) => onResize('guide', size)}
          onReset={() => onResize('guide', null)}
        />

        <section
          id="level-workspace"
          className={`level-workspace${panels.editor ? '' : ' level-workspace--terminal-only'}`}
          aria-label="Workspace"
          tabIndex={-1}
        >
          {panels.editor && (
            <div className="level-workspace__editor" id="level-editor">
              {slots.editor}
            </div>
          )}
          {panels.editor && (
            <Splitter
              label="Resize the editor and the terminal"
              orientation="horizontal"
              direction={1}
              limits={PANEL_LIMITS.editor}
              step={SPLIT_STEP_PERCENT}
              value={sizes.editor}
              measure={editorShare}
              pxPerUnit={percentPx}
              onResize={(size) => onResize('editor', size)}
              onReset={() => onResize('editor', null)}
            />
          )}
          <section className="level-terminal" id="level-terminal" aria-label="Terminal">
            <div className="level-terminal__head">
              Terminal
              <span role="status" aria-live="polite">
                {terminalStatus ?? terminalLabel}
              </span>
            </div>
            <div className="level-terminal__slot">{slots.terminal}</div>
          </section>
        </section>

        {panels.xray && (
          <Splitter
            inert={card !== null}
            label="Resize X-ray"
            orientation="vertical"
            direction={-1}
            limits={PANEL_LIMITS.xray}
            step={WIDTH_STEP_REM}
            value={sizes.xray}
            measure={() => widthOf('level-xray')}
            pxPerUnit={remPx}
            onResize={(size) => onResize('xray', size)}
            onReset={() => onResize('xray', null)}
          />
        )}
        {/* A plain dock, not a landmark: X-ray names its own region, so a label here would be announced twice. */}
        {panels.xray && (
          <div className="level-xray" id="level-xray" tabIndex={-1} inert={card !== null}>
            <div className="level-xray__slot">{slots.xray}</div>
            <TitleBlock entries={titleBlock} />
          </div>
        )}
        {/* The debrief takes the workspace and X-ray together, so it reads whole on a narrow screen. */}
        {card && <CardOverlay card={card} />}
      </main>

      <Dialog open={taintReport.open} onClose={taintReport.onClose} title="Taint report">
        {taintReport.entries.length === 0 ? (
          <p>
            No Taint on this level. Taint comes from hacks that would still pass: leaks, ignored errors, warnings. Hints
            never add Taint.
          </p>
        ) : (
          <ul className="level-taint-list">
            {taintReport.entries.map((entry) => (
              <li key={entry.id}>
                <b>
                  +{entry.points} Taint: <code>{entry.id}</code>
                </b>
                <p>{entry.detail}</p>
              </li>
            ))}
          </ul>
        )}
      </Dialog>

      <Dialog
        open={reference.open}
        onClose={reference.onCancel}
        title="Continue with init's version?"
        actions={
          <>
            <Button variant="quiet" onClick={reference.onCancel}>
              Keep working
            </Button>
            <Button variant="primary" onClick={reference.onConfirm}>
              Continue with init's version
            </Button>
          </>
        }
      >
        <p>
          init finishes the level with the reference version. It costs this level's score, never Taint, and the level
          counts as completed with help. Its skills and Codex cards still unlock, and you can replay it any time for a
          clean result.
        </p>
      </Dialog>

      <Dialog
        open={replay.open}
        onClose={replay.onCancel}
        title="Replay this level?"
        actions={
          <>
            <Button variant="quiet" onClick={replay.onCancel}>
              Keep playing
            </Button>
            <Button variant="primary" onClick={replay.onConfirm}>
              Replay from the scene
            </Button>
          </>
        }
      >
        <p>
          The level starts again from its scene on a fresh Machine: this play-through's steps and hints are dropped.
          Your code stays, and a level you already completed keeps its best result.
        </p>
      </Dialog>
    </ScreenFrame>
  )
}
