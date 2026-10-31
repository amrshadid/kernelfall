import type {
  MapScene,
  MapVariant,
  SceneGate,
  SceneHardware,
  SceneLayer,
  ScenePoint,
  SceneRect,
  SceneRegion,
  SceneStop,
  SceneText,
  TextStyle,
} from '@features/map/types'
import type { LayerId, MapLayer, MapNode, MapRegion, NodeState } from '@shared/types'
import { isDone, isReached, roadOf } from '@shared/utils/map'
import { cellsOf, perRowAt, rowsOf } from './map-grid.util'
import { EDGE, LINE, NUM_DROP, PAD, SPUR, STOP_DROP, TOP } from './map-layout.constants'
import { GLYPH } from './map-text.constants'
import { charsIn, stopLines, textWidth, wrapWords } from './map-text.util'

const LOCKED: NodeState = 'locked'

function text(
  x: number,
  y: number,
  value: string,
  style: TextStyle,
  anchor: SceneText['anchor'] = 'start',
  dim = false
): SceneText {
  return { x, y, text: value, style, anchor, dim }
}

function stopTexts(node: MapNode, x: number, y: number, maxChars: number): SceneText[] {
  const dim = node.state === LOCKED
  const tag = node.side ? ' · side' : node.boss ? ' · boss' : ''
  return [
    text(x, y + NUM_DROP, `${node.number}${tag}`, 'num', 'middle', dim),
    ...stopLines(node.title, maxChars).map((line, index) =>
      text(x, y + NUM_DROP + LINE * (index + 1), line, 'label', 'middle', dim)
    ),
  ]
}

class Builder {
  y = TOP
  /** +1: the next row runs left to right. */
  dir = 1
  readonly points: ScenePoint[] = []
  readonly stopPoint = new Map<string, number>()
  readonly stops: SceneStop[] = []
  readonly spurs: { key: string; d: string; reached: boolean }[] = []
  gate: SceneGate | null = null
  hardware: SceneHardware | null = null

  constructor(
    readonly width: number,
    readonly variant: MapVariant
  ) {}

  /** The overview keeps a header to its name and progress, so more of the road fits around "you". */
  get full(): boolean {
    return this.variant === 'map'
  }

  get contentWidth(): number {
    return this.width - 2 * PAD
  }

  edge(dir: number): number {
    return dir > 0 ? EDGE : this.width - EDGE
  }

  /** The road comes down the side it left the last row on, then turns along this row. */
  enterAt(y: number): void {
    this.points.push({ x: this.edge(this.dir), y })
  }

  header(layer: MapLayer): { texts: SceneText[]; panel: SceneRect } {
    const texts: SceneText[] = []
    const top = this.y + 14
    let y = top + 6
    for (const line of wrapWords(layer.kicker.toUpperCase(), charsIn(this.contentWidth, GLYPH.kicker))) {
      y += 18
      texts.push(text(PAD, y, line, 'kicker'))
    }
    y += 30
    texts.push(text(PAD, y, layer.name, 'zone'))
    if (layer.progress !== '') {
      const fits =
        PAD + textWidth(layer.name, GLYPH.zone) + 24 + textWidth(layer.progress, GLYPH.caption) <= this.width - PAD
      if (!fits) {
        y += 22
      }
      texts.push(text(fits ? this.width - PAD : PAD, y, layer.progress, `tone-${layer.tone}`, fits ? 'end' : 'start'))
    }
    if (this.full) {
      y += 6
      for (const line of wrapWords(layer.caption, charsIn(this.contentWidth, GLYPH.caption))) {
        y += 20
        texts.push(text(PAD, y, line, 'caption'))
      }
      y += 4
      for (const line of wrapWords(`Kernel source: ${layer.source}`, charsIn(this.contentWidth, GLYPH.mono))) {
        y += 17
        texts.push(text(PAD, y, line, 'mono'))
      }
      for (const line of wrapWords(`Guides: ${layer.guides}`, charsIn(this.contentWidth, GLYPH.meta))) {
        y += 17
        texts.push(text(PAD, y, line, 'meta'))
      }
    }
    const bottom = y + 14
    this.y = bottom
    return { texts, panel: { x: PAD - 14, y: top, width: this.contentWidth + 28, height: bottom - top } }
  }

  regionHead(region: MapRegion): SceneText[] {
    const texts: SceneText[] = []
    let y = this.y + 34
    texts.push(text(PAD, y, region.name, 'region'))
    const fits =
      PAD + textWidth(region.name, GLYPH.region) + 20 + textWidth(region.progress, GLYPH.meta) <= this.width - PAD
    if (!fits) {
      y += 17
    }
    texts.push(text(fits ? this.width - PAD : PAD, y, region.progress, `tone-${region.tone}`, fits ? 'end' : 'start'))
    if (region.info && this.full) {
      const about = `${region.info.caption} · guide: ${region.info.guide}`
      for (const line of wrapWords(about, charsIn(this.contentWidth, GLYPH.meta))) {
        y += 16
        texts.push(text(PAD, y, line, 'meta'))
      }
      for (const line of wrapWords(region.info.source, charsIn(this.contentWidth, GLYPH.mono))) {
        y += 16
        texts.push(text(PAD, y, line, 'mono'))
      }
    }
    this.y = y
    return texts
  }

  row(nodes: readonly MapNode[], layerId: LayerId): void {
    const rowTop = this.y
    const y = rowTop + STOP_DROP
    const { xs, cell } = cellsOf(nodes.length, this.width)
    const ordered = this.dir > 0 ? xs : [...xs].reverse()
    const maxChars = charsIn(cell - 12, GLYPH.label)
    let bottom = y
    this.enterAt(y)
    nodes.forEach((node, index) => {
      const x = ordered[index] ?? xs[0] ?? PAD
      if (node.side) {
        const sideY = y + SPUR
        const texts = stopTexts(node, x, sideY, maxChars)
        this.stops.push({ key: node.key, node, layerId, x, y: sideY, texts, spurFrom: { x, y } })
        this.spurs.push({
          key: node.key,
          d: `M${x} ${y} V${sideY - 13}`,
          reached: node.state !== LOCKED,
        })
        bottom = Math.max(bottom, (texts[texts.length - 1]?.y ?? sideY) + 14)
        return
      }
      const texts = stopTexts(node, x, y, maxChars)
      this.stopPoint.set(node.key, this.points.length)
      this.points.push({ x, y })
      this.stops.push({ key: node.key, node, layerId, x, y, texts, spurFrom: null })
      bottom = Math.max(bottom, (texts[texts.length - 1]?.y ?? y) + 14)
    })
    this.points.push({ x: this.edge(-this.dir), y })
    this.dir = -this.dir
    this.y = bottom
  }

  /** The road turns down through the gate in the A–A line; the words fill the quarters it doesn't use. */
  gateRow(layer: MapLayer, node: MapNode): SceneText[] {
    const cx = Math.round(this.width / 2)
    const entryLeft = this.dir > 0
    const texts: SceneText[] = []
    const top = this.y
    const y1 = top + 26
    this.enterAt(y1)
    this.points.push({ x: cx, y: y1 })

    const quarter = this.width / 2 - 64 - PAD
    const aboveX = entryLeft ? cx + 64 : PAD
    let y = top + 22
    texts.push(text(aboveX, y, layer.kicker.toUpperCase(), 'kicker'))
    y += 26
    texts.push(text(aboveX, y, layer.name, 'gate-zone'))
    if (this.full) {
      y += 4
      for (const line of wrapWords(layer.caption, charsIn(quarter, GLYPH.caption))) {
        y += 19
        texts.push(text(aboveX, y, line, 'caption'))
      }
      for (const line of wrapWords(`Kernel source: ${layer.source}`, charsIn(quarter, GLYPH.mono))) {
        y += 17
        texts.push(text(aboveX, y, line, 'mono'))
      }
      for (const line of wrapWords(`Guide: ${layer.guides}`, charsIn(quarter, GLYPH.meta))) {
        y += 17
        texts.push(text(aboveX, y, line, 'meta'))
      }
    }
    const lineY = Math.max(y1 + 76, y + 34)
    this.stopPoint.set(node.key, this.points.length)
    this.points.push({ x: cx, y: lineY })

    const belowX = entryLeft ? cx - 52 : cx + 52
    const anchor = entryLeft ? 'end' : 'start'
    const dim = node.state === LOCKED
    const words = charsIn(quarter, GLYPH.label)
    const stopText: SceneText[] = [text(belowX, lineY + 34, `${node.number} · boss`, 'num', anchor, dim)]
    for (const line of wrapWords(node.title, words)) {
      stopText.push(text(belowX, (stopText[stopText.length - 1]?.y ?? lineY) + LINE, line, 'label', anchor, dim))
    }
    const state = node.planned ? 'not built yet' : node.status
    for (const line of wrapWords(state, words)) {
      stopText.push(text(belowX, (stopText[stopText.length - 1]?.y ?? lineY) + LINE, line, 'meta', anchor, true))
    }
    this.stops.push({ key: node.key, node, layerId: layer.id, x: cx, y: lineY, texts: stopText, spurFrom: null })

    const y2 = Math.max(lineY + 70, (stopText[stopText.length - 1]?.y ?? lineY) + 26)
    this.points.push({ x: cx, y: y2 })
    this.points.push({ x: this.edge(-this.dir), y: y2 })
    this.dir = -this.dir
    this.gate = { x: cx, y: lineY, open: isDone(node), left: 30, right: this.width - 30 }
    this.y = y2
    return texts
  }

  /** Bedrock: the hardware every layer above runs on, on one bus. */
  hardwareRow(): void {
    const names = [['CPU'], ['Memory', '(RAM)'], ['Disk'], ['Network', 'card'], ['Lantern', 'card']] as const
    const gap = 12
    const top = this.y + 24
    const boxWidth = (this.contentWidth - gap * (names.length - 1)) / names.length
    const boxes = names.map((lines, index) => ({
      x: Math.round(PAD + index * (boxWidth + gap)),
      y: top,
      width: Math.round(boxWidth),
      height: 50,
      lines,
    }))
    this.hardware = { boxes, busY: top + 78, busLeft: PAD, busRight: this.width - PAD }
    this.y = top + 98
  }
}

/** Lays the map out at `width` px, drawn 1:1 so text stays its real size. */
export function layoutMap(layers: readonly MapLayer[], width: number, variant: MapVariant = 'map'): MapScene {
  const b = new Builder(width, variant)
  const sceneLayers: SceneLayer[] = []
  const perRow = perRowAt(width)

  for (const layer of layers) {
    const top = b.y
    if (layer.id === 'gate') {
      const node = layer.regions[0]?.nodes[0]
      const texts = node ? b.gateRow(layer, node) : []
      b.y += 18
      sceneLayers.push({
        id: layer.id,
        top,
        bottom: b.y,
        tone: layer.tone,
        panel: null,
        texts,
        regions: [],
        name: layer.name,
        summary: layer.summary,
      })
      continue
    }
    const head = b.header(layer)
    const regions: SceneRegion[] = []
    for (const region of layer.regions) {
      const regionTop = b.y
      const texts = b.regionHead(region)
      for (const row of rowsOf(region.nodes, perRow)) {
        b.row(row, layer.id)
      }
      regions.push({ key: region.key, texts, top: regionTop, bottom: b.y })
    }
    if (layer.id === 'bedrock') {
      b.hardwareRow()
    }
    b.y += 22
    sceneLayers.push({
      id: layer.id,
      top,
      bottom: b.y,
      tone: layer.tone,
      panel: head.panel,
      texts: head.texts,
      regions,
      name: layer.name,
      summary: layer.summary,
    })
  }

  // The road ends at the last stop, not at the sheet's edge.
  const points = b.points.slice(0, -1)
  const main = b.stops.filter((stop) => stop.spurFrom === null)
  const reachedStop = [...main].reverse().find((stop) => isReached(stop.node))
  const split = reachedStop ? (b.stopPoint.get(reachedStop.key) ?? 0) : 0
  const hereStop = b.stops.find((stop) => stop.node.here)

  return {
    variant,
    width,
    height: b.y + TOP,
    layers: sceneLayers,
    stops: b.stops,
    road: roadOf(points, split),
    spurs: b.spurs,
    start: points[0] ?? null,
    gate: b.gate,
    hardware: b.hardware,
    here: hereStop ? { key: hereStop.key, x: hereStop.x, y: hereStop.y } : null,
  }
}
