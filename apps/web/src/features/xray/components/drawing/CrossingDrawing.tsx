import type { CrossingScene, CrossingStoryboard } from '@features/xray/types'
import {
  CROSSING_CARD as CARD,
  CARD_LINE,
  CROSSING_FIT,
  CROSSING_KERNEL_LABEL_Y,
  crossingDrawingLayout,
  DRAWING_WIDTH,
  fitText,
  GATE_POSTS,
  LANE_X,
  CROSSING_LINE_Y as LINE_Y,
  PART_HEIGHT,
  PART_WIDTH,
  CROSSING_PARTS_TOP as PARTS_TOP,
  CROSSING_PROGRAM as PROGRAM,
  TERMINAL_HEIGHT,
} from '@features/xray/utils/drawing'
import { DrawingBox } from './DrawingBox'
import './Drawing.css'
import './CrossingDrawing.css'

export interface CrossingDrawingProps {
  storyboard: CrossingStoryboard
  scene: CrossingScene
  /** The drawing's accessible name: the figure and the beat on show. */
  label: string
}

const HEAD = 6
const PART_X = 14
const TEXT_X = 24
const ARROW_X = PART_X + PART_WIDTH / 2

/** Simple's one picture: Userland, the Gate, the kernel's parts, the terminal; one red mark per beat. */
export function CrossingDrawing({ storyboard, scene, label }: CrossingDrawingProps) {
  const { parts, answer } = storyboard
  const { beat } = scene
  const layout = crossingDrawingLayout(storyboard, scene)
  const { text } = layout
  const laneTop = PROGRAM.y + CARD.height
  const servedY = layout.partsY[parts.findIndex((part) => part.served)] ?? PARTS_TOP

  return (
    <svg viewBox={`0 0 ${DRAWING_WIDTH} ${layout.height}`} role="img" aria-label={label}>
      <text className="xr-zone" x={14} y={16}>
        Userland
      </text>
      <text className="xr-m xr-dim" x={DRAWING_WIDTH - 14} y={16} textAnchor="end">
        user mode
      </text>
      <DrawingBox x={PROGRAM.x} y={PROGRAM.y} width={PROGRAM.width} height={PROGRAM.height} title={text.title}>
        <text className="xr-m xr-dim" x={TEXT_X} y={PROGRAM.y + 42}>
          {text.callLine}
        </text>
        <text className={`xr-m xr-mb xr-fade${layout.answering ? '' : ' xr-hide'}`} x={TEXT_X} y={PROGRAM.y + 60}>
          {text.returnLine}
        </text>
      </DrawingBox>

      <line className="xr-lane" x1={LANE_X} y1={laneTop} x2={LANE_X} y2={PARTS_TOP} />
      {layout.answering ? (
        <path
          className="xr-lane-head"
          d={`M${LANE_X - HEAD} ${laneTop + HEAD} L${LANE_X} ${laneTop} L${LANE_X + HEAD} ${laneTop + HEAD}`}
        />
      ) : (
        <path
          className="xr-lane-head"
          d={`M${LANE_X - HEAD} ${PARTS_TOP - HEAD} L${LANE_X} ${PARTS_TOP} L${LANE_X + HEAD} ${PARTS_TOP - HEAD}`}
        />
      )}

      <line className="xr-line" x1={0} y1={LINE_Y} x2={DRAWING_WIDTH} y2={LINE_Y} />
      <text className="xr-ttl xr-dim" x={14} y={LINE_Y - 8}>
        A–A · the Gate
      </text>
      {GATE_POSTS.map((x) => (
        <rect key={x} className="xr-frame" x={x} y={LINE_Y - 13} width={7} height={26} />
      ))}

      <text className="xr-zone" x={14} y={CROSSING_KERNEL_LABEL_Y}>
        The kernel
      </text>
      <text className="xr-m xr-dim" x={DRAWING_WIDTH - 14} y={CROSSING_KERNEL_LABEL_Y} textAnchor="end">
        kernel mode
      </text>
      {parts.map((part, i) => {
        const y = layout.partsY[i] ?? PARTS_TOP
        return (
          <DrawingBox
            key={part.id ?? 'kernel'}
            x={PART_X}
            y={y}
            width={PART_WIDTH}
            height={PART_HEIGHT}
            on={beat === 'kernel' && part.served}
          >
            <text className="xr-ttl" x={TEXT_X} y={y + 14}>
              {fitText(part.name, CROSSING_FIT.part)}
            </text>
            <text className="xr-m xr-dim" x={TEXT_X} y={y + 27}>
              {fitText(part.detail, CROSSING_FIT.detail)}
            </text>
          </DrawingBox>
        )
      })}

      {layout.hardwareY !== null && layout.terminalY !== null && (
        <g>
          <text className="xr-zone" x={14} y={layout.hardwareY}>
            Hardware
          </text>
          <DrawingBox
            x={PART_X}
            y={layout.terminalY}
            width={PART_WIDTH}
            height={TERMINAL_HEIGHT}
            title="Terminal"
            on={beat === 'device'}
          >
            <text
              className={`xr-m xr-mb xr-fade${layout.printed ? '' : ' xr-hide'}`}
              x={TEXT_X}
              y={layout.terminalY + 40}
            >
              {text.terminal}
            </text>
          </DrawingBox>
          {beat === 'device' && (
            <path
              className="xr-signal"
              d={`M${ARROW_X} ${servedY + PART_HEIGHT} V${layout.terminalY - 2} M${ARROW_X - HEAD} ${layout.terminalY - 2 - HEAD} L${ARROW_X} ${layout.terminalY - 2} L${ARROW_X + HEAD} ${layout.terminalY - 2 - HEAD}`}
            />
          )}
        </g>
      )}

      <g className="xr-move" style={{ transform: `translate(0px, ${layout.cardY}px)` }}>
        <DrawingBox
          x={CARD.x}
          y={0}
          width={CARD.width}
          height={CARD.height}
          on={beat === 'ask' || beat === 'gate' || beat === 'answer'}
        >
          {layout.answering ? (
            <g key="answer" className="xr-flip">
              <text className="xr-ttl xr-dim" x={CARD.x + CARD.pad} y={18}>
                The answer
              </text>
              <text className="xr-m xr-mb xr-big" x={CARD.x + CARD.pad} y={42}>
                {answer.value}
              </text>
              {text.meaning.map((line, i) => (
                <text key={line} className="xr-card-say" x={CARD.x + CARD.pad} y={60 + i * CARD_LINE}>
                  {line}
                </text>
              ))}
            </g>
          ) : (
            <g key="request">
              {text.request.map((line, i) => (
                <text key={line} className="xr-card-say" x={CARD.x + CARD.pad} y={20 + i * CARD_LINE}>
                  {line}
                </text>
              ))}
              {text.path !== null && (
                <text className="xr-m" x={CARD.x + CARD.pad} y={20 + text.request.length * CARD_LINE}>
                  {text.path}
                </text>
              )}
              <text className="xr-m xr-dim" x={CARD.x + CARD.pad} y={CARD.height - 10}>
                {text.footer}
              </text>
            </g>
          )}
        </DrawingBox>
      </g>
    </svg>
  )
}
