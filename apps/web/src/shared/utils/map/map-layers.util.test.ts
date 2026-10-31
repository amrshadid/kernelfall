import { emptyProgress } from '@kernelfall/game/utils'
import { describe, expect, it } from 'vitest'
import { doneWithHelp, levelIdsIn, nodesFor, realContent } from '@/test/fixtures/map.fixture'
import { layersOf, mapLayers, toneOf } from './map-layers.util'

describe('mapLayers', () => {
  it('puts every region in its layer, going deeper down the Machine', () => {
    const loaded = realContent()
    const layers = mapLayers(loaded, nodesFor(emptyProgress(), loaded))
    const regions = (id: string) => layers.find((layer) => layer.id === id)?.regions.map((region) => region.key)
    expect(regions('surface')).toEqual(['prologue/boot-path', 'prologue/machine-in-section'])
    expect(regions('userland')?.[0]).toBe('prologue/surface-survey')
    expect(regions('gate')).toEqual(['act1/syscall-gate'])
    expect(regions('deep')?.at(-1)).toBe('act2/mainline')
    expect(regions('core')?.at(-1)).toBe('act3/mainline')
    expect(regions('bedrock')).toEqual([])
  })

  it("draws every layer the content defines, with each region's caption, source and guide", () => {
    const loaded = realContent()
    expect(layersOf(loaded).map((layer) => layer.id)).toEqual(loaded.layers.map((layer) => layer.key))
    const district = mapLayers(loaded, nodesFor(emptyProgress(), loaded))
      .flatMap((layer) => layer.regions)
      .find((region) => region.key === 'act1/process-district')
    expect(district?.info).toEqual({
      caption: 'processes: fork, exec, wait, file descriptors, pipes, signals',
      source: 'kernel/fork.c, fs/exec.c, fs/pipe.c, kernel/signal.c',
      guide: 'init',
    })
  })

  it("counts each layer's progress and knows where you are", () => {
    const loaded = realContent()
    const fresh = mapLayers(loaded, nodesFor(emptyProgress(), loaded))
    const surface = fresh.find((layer) => layer.id === 'surface')
    expect(surface).toMatchObject({ done: 0, total: 10, progress: '0 of 10 rebuilt', tone: 'progress', hasHere: true })
    expect(fresh.find((layer) => layer.id === 'deep')).toMatchObject({ tone: 'dark', hasHere: false })
    expect(fresh.find((layer) => layer.id === 'bedrock')?.progress).toBe('')

    const surfaceDone = levelIdsIn(loaded, 'prologue/boot-path', 'prologue/machine-in-section')
    const later = mapLayers(loaded, nodesFor(doneWithHelp(...surfaceDone), loaded))
    expect(later.find((layer) => layer.id === 'surface')?.done).toBe(10)
    expect(later.find((layer) => layer.id === 'userland')?.hasHere).toBe(true)
    const survey = later
      .find((layer) => layer.id === 'userland')
      ?.regions.find((r) => r.key === 'prologue/surface-survey')
    expect(survey?.progress).toBe('in progress · 0 of 5')
  })

  it('reads each layer for screen readers in one sentence with its progress and source', () => {
    const loaded = realContent()
    const userland = mapLayers(loaded, nodesFor(emptyProgress(), loaded)).find((layer) => layer.id === 'userland')
    expect(userland?.summary).toMatch(/^Userland\. Where programs live.*0 of \d+ rebuilt\. Kernel source: /)
  })
})

describe('toneOf', () => {
  it('is rebuilt when every slot is done, in progress when one is open, else dark', () => {
    expect(toneOf([{ state: 'done' }, { state: 'clean' }] as never)).toBe('rebuilt')
    expect(toneOf([{ state: 'done' }, { state: 'locked' }] as never)).toBe('progress')
    expect(toneOf([{ state: 'available' }] as never)).toBe('progress')
    expect(toneOf([{ state: 'locked' }] as never)).toBe('dark')
    expect(toneOf([])).toBe('dark')
  })
})
