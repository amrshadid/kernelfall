import type { SyscallScene, SyscallStoryboard } from '@features/xray/types'
import {
  CELL_HEIGHT,
  DRAWING_WIDTH,
  GATE_GAP,
  GATE_X,
  SYSCALL_KERNEL_TOP as KERNEL_TOP,
  SYSCALL_LINE_Y as LINE_Y,
  SYSCALL_PATH_ROW as PATH_ROW,
  SYSCALL_PATH_TOP as PATH_TOP,
  REGISTER_ROW,
  SYSCALL_RIGHT_W as RIGHT_W,
  SYSCALL_RIGHT_X as RIGHT_X,
  syscallDrawingLayout,
  syscallDrawingText,
  SYSCALL_TAG_X as TAG_X,
  SYSCALL_USER_BUFFER_Y as USER_BUFFER_Y,
} from '@features/xray/utils/drawing'
import type { CSSProperties } from 'react'
import { ByteCells } from './ByteCells'
import { CrossingTag } from './CrossingTag'
import { DrawingBox } from './DrawingBox'
import { DrawingTable } from './DrawingTable'
import { SectionLine } from './SectionLine'
import './Drawing.css'

export interface SyscallDrawingProps {
  storyboard: SyscallStoryboard
  scene: SyscallScene
  /** The drawing's accessible name: the figure and the stage on show. */
  label: string
}

/** Deep's drawing of one syscall; everything it prints comes from the trace's events for this call. */
export function SyscallDrawing({ storyboard, scene, label }: SyscallDrawingProps) {
  const { call, path } = storyboard
  const {
    height,
    kernelBufferY,
    pointerY,
    inKernel,
    write,
    toScreen,
    showBuffer,
    kernelBuffer,
    slot,
    registers,
    ptRegs,
  } = syscallDrawingLayout(storyboard, scene)
  const text = syscallDrawingText(storyboard)

  return (
    <svg viewBox={`0 0 ${DRAWING_WIDTH} ${height}`} role="img" aria-label={label}>
      <text className="xr-zone" x={14} y={16}>
        User space · ring 3
      </text>

      <DrawingBox
        x={14}
        y={26}
        width={236}
        height={66}
        title={text.title}
        on={scene.step === 'call' || scene.step === 'sysret'}
      >
        <rect
          className={scene.step === 'call' ? 'xr-rowbg xr-rowbg--on' : 'xr-rowbg'}
          x={16}
          y={52}
          width={232}
          height={20}
        />
        <rect className="xr-bar" x={16} y={52} width={4} height={20} />
        <text className="xr-m" x={24} y={66}>
          {text.callLine}
        </text>
        <text className={`xr-m xr-mb xr-red xr-fade${scene.back ? '' : ' xr-hide'}`} x={24} y={84}>
          {text.returnLine}
        </text>
      </DrawingBox>

      <g className="xr-deep">
        <DrawingTable
          x={RIGHT_X}
          y={26}
          width={RIGHT_W}
          title="CPU registers"
          rows={registers}
          keyWidth={48}
          rowHeight={REGISTER_ROW}
          faint={inKernel && !scene.answered && scene.step !== 'gate'}
        />
      </g>

      {showBuffer && call.buffer && (
        <g>
          <text className="xr-ttl" x={14} y={USER_BUFFER_Y - 6}>
            buf · user memory at {call.buffer.address}
          </text>
          <ByteCells x={14} y={USER_BUFFER_Y} cells={call.buffer.cells} more={call.buffer.more} />
        </g>
      )}
      {!write && call.path !== null && (
        <g>
          <text className="xr-ttl" x={14} y={USER_BUFFER_Y - 6}>
            the path · user memory
          </text>
          <text className="xr-m xr-mb" x={14} y={USER_BUFFER_Y + 14}>
            {text.path}
          </text>
        </g>
      )}

      {toScreen && (
        <DrawingBox x={14} y={150} width={270} height={46} title="Terminal · /dev/ttyS0" on={scene.step === 'driver'}>
          <text className={`xr-m xr-mb xr-fade${scene.printed ? '' : ' xr-hide'}`} x={24} y={188}>
            {text.console}
          </text>
        </DrawingBox>
      )}

      <SectionLine y={LINE_Y} width={DRAWING_WIDTH} slot={slot} gateX={GATE_X} />
      {scene.step === 'gate' && (
        <CrossingTag key={call.id} name={call.name} nr={call.nr} x={TAG_X} y={LINE_Y} maxRight={GATE_X - GATE_GAP} />
      )}

      <g className="xr-deep">
        <text className="xr-ttl" x={14} y={KERNEL_TOP + 12}>
          Call path
        </text>
        {path.map((name, i) => {
          const y = KERNEL_TOP + PATH_TOP + i * PATH_ROW
          const on = scene.active.includes(name)
          return (
            <g key={name}>
              <rect className={on ? 'xr-rowbg xr-rowbg--on' : 'xr-rowbg'} x={14} y={y} width={228} height={PATH_ROW} />
              <rect className="xr-bar" x={14} y={y} width={4} height={PATH_ROW} />
              <text className={i < scene.reached ? 'xr-m' : 'xr-m xr-dim'} x={24 + Math.min(i, 6) * 8} y={y + 12.5}>
                {i > 0 ? '→ ' : ''}
                {name}
              </text>
            </g>
          )
        })}
        <DrawingTable
          x={252}
          y={KERNEL_TOP}
          width={134}
          title="struct pt_regs"
          rows={ptRegs}
          keyWidth={64}
          rowHeight={REGISTER_ROW}
          on={scene.step === 'entry'}
          faint={!scene.saved}
        />
      </g>

      {kernelBuffer && call.buffer && (
        <g>
          <text className="xr-ttl" x={14} y={kernelBufferY - 6}>
            kernel memory · {toScreen ? 'the tty write buffer' : 'the copy'}
          </text>
          <ByteCells x={14} y={kernelBufferY} cells={call.buffer.cells.map(() => '')} />
          {scene.copied && (
            <g
              key={`${call.id}-${scene.step === 'copy'}`}
              className={scene.step === 'copy' ? 'xr-fly' : undefined}
              style={{ '--xr-fly-from': `${USER_BUFFER_Y - kernelBufferY}px` } as CSSProperties}
            >
              <ByteCells x={14} y={kernelBufferY} cells={call.buffer.cells} tone="copy" />
            </g>
          )}
          <text className="xr-m xr-dim" x={14} y={kernelBufferY + CELL_HEIGHT + 14}>
            {scene.copied ? 'Your buf is untouched: this is a copy.' : ''}
          </text>
        </g>
      )}

      <g className="xr-move" style={{ transform: `translate(2px, ${pointerY}px)` }}>
        <path d="M0 -7 L11 0 L0 7 Z" fill="var(--red)" />
      </g>
    </svg>
  )
}
