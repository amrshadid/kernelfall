import { describe, expect, it } from 'vitest'
import { checkInputsOf, levelUnderTest, metBy, recordedCommands, recordedInputs, verdictOf } from '#test/index'

const ID = 'prologue-surface-survey-02-who-may-enter'
const level = levelUnderTest(ID)
const missing = (run: string) => verdictOf(level, recordedInputs(ID, run))?.missing.map(({ id }) => id) ?? []
const metPerCommand = (run: string) => recordedInputs(ID, run).map((input) => metBy(level, input))

describe('Who May Enter', () => {
  it("meets exec-allowed and dir-denied only after the chmods that took hi's and box's x away", () => {
    const met = metPerCommand('solution')
    const lines = recordedCommands(ID, 'solution').map(({ commandLine }) => commandLine)

    expect(met[lines.indexOf('chmod u+x hi') + 1]).toContain('exec-allowed')
    expect(met[lines.indexOf('chmod 644 box') + 1]).toContain('dir-denied')
    expect(missing('solution')).toEqual([])
  })

  it('rejects a hi that runs before its x was ever taken away', () => {
    const commands = recordedCommands(ID, 'exec-never-removed')

    expect(commands.map(({ status }) => status)).toEqual([0, 0])
    expect(missing('exec-never-removed')).toContain('exec-allowed')
  })

  it("rejects a refusal by the note's own mode while box still has its x", () => {
    const commands = recordedCommands(ID, 'file-not-dir')

    expect(commands.at(-1)?.status).toBe(1)
    expect(missing('file-not-dir')).toContain('dir-denied')
  })

  it('judges the same refusal as a folder without x once a chmod took it away', () => {
    const commands = recordedCommands(ID, 'file-not-dir')
    const withBoxLocked = commands.map((command) =>
      command.commandLine === 'chmod 000 box/notes.txt' ? { ...command, commandLine: 'chmod u-x box' } : command
    )

    expect(metBy(level, checkInputsOf(withBoxLocked).at(-1) ?? [])).toContain('dir-denied')
  })

  it('reads symbolic and octal modes, and ignores a line bash would have to expand', () => {
    const cat = recordedInputs(ID, 'file-not-dir').at(-1)
    const after = (...history: string[]) =>
      metBy(level, {
        events: cat?.events ?? [],
        history: history.map((commandLine) => ({ commandLine, status: 0 })),
      }).includes('dir-denied')

    expect(after('chmod 600 box')).toBe(true)
    expect(after('chmod go-x,u=rw box/')).toBe(true)
    expect(after('chmod -R a-x box')).toBe(true)
    expect(after('chmod go-x box')).toBe(false)
    expect(after('chmod 644 box', 'chmod u+x box')).toBe(false)
    expect(after('chmod 644 "box"')).toBe(false)
    expect(after('chmod 644 box/notes.txt')).toBe(false)
  })
})
