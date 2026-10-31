// @vitest-environment jsdom
import { bootViewOf } from '@features/xray/utils/boot'
import { render, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { bootWith, machineBoot } from '@/test/fixtures/boot-record.fixture'
import { BootDrawing } from './BootDrawing'

describe('BootDrawing', () => {
  it('numbers each stage with its time and its dmesg lines, as dmesg prints them', () => {
    const { container } = render(<BootDrawing view={bootViewOf(machineBoot())} />)
    const stages = container.querySelectorAll('.xr-boot__stages > li')
    expect([...stages].map((stage) => stage.querySelector('.xr-boot__title span')?.textContent)).toEqual([
      'Firmware',
      'Kernel start',
      'Command line',
      'Drivers and initcalls',
      'initramfs',
      'PID 1',
      'Root filesystem',
    ])
    const init = within(stages[5] as HTMLElement)
    expect(init.getByText('t = 2.118784 s')).toBeTruthy()
    expect(stages[5]?.querySelector('pre')?.textContent).toContain('[    2.132003] Run /init as init process')
  })

  it('folds a long stage, and keeps the whole log one click away', () => {
    const { container } = render(<BootDrawing view={bootViewOf(machineBoot())} />)
    const firmware = container.querySelector('.xr-boot__stages > li')
    expect(firmware?.querySelector('.xr-boot__more summary')?.textContent).toBe('3 more lines')
    expect(container.querySelector('.xr-boot__log summary')?.textContent).toBe(
      `Full kernel log (dmesg, ${machineBoot().log.length} lines)`
    )
  })

  it('marks unknown arguments and the stage a boot stopped at', () => {
    const view = bootViewOf(
      bootWith((record) => ({
        ...record,
        summary: {
          ...record.summary,
          cmdline: 'console=ttyS0 kf.bogus=1',
          unknownParams: ['kf.bogus=1'],
          outcome: 'initramfs',
          failedStage: 'root',
          rootDevice: 'rootfs',
        },
      }))
    )
    const { container } = render(<BootDrawing view={view} />)
    expect(container.querySelector('.xr-boot__param--unknown')?.textContent).toContain('kf.bogus=1')
    expect(container.querySelectorAll('.xr-boot__stage--failed')).toHaveLength(1)
    expect(container.querySelector('.xr-boot__tick--failed')).not.toBeNull()
  })
})
