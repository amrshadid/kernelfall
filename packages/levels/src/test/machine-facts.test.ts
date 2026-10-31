import { describe, expect, it } from 'vitest'
import { FACT_COMMANDS, machineFacts } from '#test/machine-facts'

describe('machine facts', () => {
  it('holds an output for every fact command (re-run pnpm vm:facts after changing the list)', () => {
    expect(Object.keys(machineFacts().outputs)).toEqual(FACT_COMMANDS)
  })
})
