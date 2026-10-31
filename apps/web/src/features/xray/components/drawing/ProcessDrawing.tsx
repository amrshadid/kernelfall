import type { ProcessScene, ProcessStoryboard } from '@features/xray/types'
import {
  PROCESS_BOX_W as BOX_W,
  PROCESS_BOX_Y as BOX_Y,
  CHILD_X,
  CROSSING_LIFT,
  DRAWING_WIDTH,
  GATE_GAP,
  GATE_X,
  PROCESS_KERNEL_TOP as KERNEL_TOP,
  PROCESS_LINE_Y as LINE_Y,
  PROCESS_NOW_Y as NOW_Y,
  PARENT_X,
  PROCESS_HEIGHT,
  processDrawingLayout,
  processDrawingText,
} from '@features/xray/utils/drawing'
import { useId } from 'react'
import { CrossingTag } from './CrossingTag'
import { DrawingBox } from './DrawingBox'
import { DrawingTable } from './DrawingTable'
import { MemoryPages } from './MemoryPages'
import { SectionLine } from './SectionLine'
import './Drawing.css'

export interface ProcessDrawingProps {
  storyboard: ProcessStoryboard
  scene: ProcessScene
  /** The drawing's accessible name: the figure and the stage on show. */
  label: string
}

/** Every PID, name, status and signal comes from the trace's events. */
export function ProcessDrawing({ storyboard, scene, label }: ProcessDrawingProps) {
  const hatch = `${useId().replaceAll(':', '')}-hatch`
  const arrow = `${hatch}-arrow`
  const layout = processDrawingLayout(storyboard, scene)
  const text = processDrawingText(storyboard, scene)
  const { parent } = storyboard.episode

  return (
    <svg viewBox={`0 0 ${DRAWING_WIDTH} ${PROCESS_HEIGHT}`} role="img" aria-label={label}>
      <defs>
        <pattern id={hatch} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="7" height="7" fill="var(--sheet)" />
          <line x1="0" y1="0" x2="0" y2="7" stroke="var(--hatch)" strokeWidth="1.6" />
        </pattern>
        <marker
          id={arrow}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0 0 L10 5 L0 10 z" fill="var(--red)" />
        </marker>
      </defs>

      <text className="xr-zone" x={14} y={16}>
        User space · ring 3
      </text>

      <DrawingBox
        x={PARENT_X}
        y={BOX_Y}
        width={BOX_W}
        height={104}
        title={text.parentTitle}
        on={scene.focus === 'parent' && scene.ring === 3}
      >
        <text className="xr-m" x={PARENT_X + 10} y={BOX_Y + 40}>
          {text.parentLine1}
        </text>
        <text className={`xr-m xr-mb${scene.collected ? ' xr-red' : ''}`} x={PARENT_X + 10} y={BOX_Y + 58}>
          {text.parentLine2}
        </text>
        <MemoryPages x={PARENT_X + 8} y={BOX_Y} pages={layout.parentPages} hatch={hatch} />
      </DrawingBox>

      <DrawingBox
        x={CHILD_X}
        y={BOX_Y}
        width={BOX_W}
        height={104}
        title={text.childTitle}
        on={scene.focus === 'child' && scene.ring === 3}
        ghost={layout.childEnded}
        hidden={!layout.hasChild}
      >
        <text className={`xr-m${scene.step === 'execfail' ? ' xr-red' : ''}`} x={CHILD_X + 10} y={BOX_Y + 40}>
          {text.childLine1}
        </text>
        <text className="xr-m xr-mb xr-red" x={CHILD_X + 10} y={BOX_Y + 58}>
          {text.childLine2}
        </text>
        <MemoryPages x={CHILD_X + 8} y={BOX_Y} pages={layout.childPages} hatch={hatch} />
      </DrawingBox>

      <g className={`xr-fade${scene.sigchld ? '' : ' xr-hide'}`}>
        <path
          className="xr-signal"
          d={`M296 ${BOX_Y} C296 ${BOX_Y - 22} 104 ${BOX_Y - 22} 104 ${BOX_Y - 4}`}
          markerEnd={`url(#${arrow})`}
        />
        <text className="xr-m xr-mb xr-red" x={304} y={BOX_Y - 10}>
          SIGCHLD
        </text>
      </g>

      {text.printed !== '' && (
        <DrawingBox
          x={14}
          y={BOX_Y + 114}
          width={278}
          height={44}
          title="Terminal · /dev/ttyS0"
          on={scene.step === 'runs'}
        >
          <text className={`xr-m xr-mb xr-fade${scene.printed ? '' : ' xr-hide'}`} x={24} y={BOX_Y + 152}>
            {text.printed}
          </text>
        </DrawingBox>
      )}

      <SectionLine
        y={LINE_Y}
        width={DRAWING_WIDTH}
        slot={scene.crossing ? String(scene.crossing.nr) : ''}
        gateX={GATE_X}
      />
      {scene.crossing && (
        <CrossingTag
          key={`${scene.step}-${scene.crossing.name}`}
          name={scene.crossing.name}
          nr={scene.crossing.nr}
          x={layout.crossingX}
          y={LINE_Y - CROSSING_LIFT}
          maxRight={GATE_X - GATE_GAP}
        />
      )}

      <DrawingTable
        x={PARENT_X}
        y={KERNEL_TOP}
        width={BOX_W}
        title={`task_struct · PID ${parent.pid}`}
        keyWidth={62}
        rowHeight={18}
        on={scene.focus === 'parent' && scene.ring === 0}
        rows={layout.parentRows}
      />
      <DrawingTable
        x={CHILD_X}
        y={KERNEL_TOP}
        width={BOX_W}
        title={`task_struct · PID ${storyboard.episode.child ?? '?'}`}
        keyWidth={62}
        rowHeight={18}
        on={scene.focus === 'child' && scene.ring === 0}
        ghost={scene.childState === 'gone'}
        hidden={!layout.hasChild}
        rows={layout.childRows}
      />

      <DrawingBox x={14} y={NOW_Y} width={372} height={56} title="In the kernel now" on={scene.ring === 0}>
        <text className="xr-m xr-mb xr-now" x={26} y={NOW_Y + 36}>
          {text.nowFn}
        </text>
        <text className="xr-m xr-dim" x={26} y={NOW_Y + 50}>
          {scene.now.file}
        </text>
      </DrawingBox>

      <g className="xr-move" style={{ transform: `translate(${layout.pointerX}px, ${layout.pointerY}px)` }}>
        <path d="M0 -7 L11 0 L0 7 Z" fill="var(--red)" />
      </g>
    </svg>
  )
}
