import { describe, expect, it } from 'vitest'
import { vmStatusLine } from './vm-status.util'

describe('vmStatusLine', () => {
  it('says what the Machine is doing while it starts, dimmed, and nothing once bash is up', () => {
    expect(vmStatusLine('booting', null)).toBe('\x1b[2mBooting Linux…\x1b[0m\r\n')
    expect(vmStatusLine('ready', null)).toBeNull()
    expect(vmStatusLine('restoring', null)).toBeNull()
  })

  it('gives the reason a start failed', () => {
    expect(vmStatusLine('failed', 'No Linux image at /vm/')).toContain('could not start: No Linux image at /vm/')
  })
})
