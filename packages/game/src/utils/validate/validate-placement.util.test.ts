import { describe, expect, it } from 'vitest'
import { validatePlacement } from '#utils/validate/validate-placement.util'

const TASK = {
  level: '05-kernel-up-close',
  task: 'Complete myuname.c so it prints the kernel name, release and CPU type.',
  files: ['myuname.c'],
  objectives: ['asks-uname', 'exits-zero'],
}
const PLACEMENT = { offer: 'Show me, and go straight to the stalled one.', minutes: 8, tasks: [TASK] }

const errorsOf = (input: unknown): readonly string[] => {
  const result = validatePlacement(input)
  return result.ok ? [] : result.errors
}

describe('validatePlacement', () => {
  it('reads the offer, its length and each task, a shell task with no files', () => {
    const { files: _files, ...shellTask } = { ...TASK, level: '06-finding-the-hardware' }

    expect(validatePlacement({ ...PLACEMENT, tasks: [TASK, shellTask] })).toEqual({
      ok: true,
      value: { ...PLACEMENT, tasks: [TASK, { ...shellTask, files: [] }] },
    })
  })

  it('reports a task with no objectives, a level named twice, a bad folder and unknown fields', () => {
    expect(
      errorsOf({
        ...PLACEMENT,
        timer: 60,
        tasks: [{ ...TASK, objectives: [] }, TASK, { ...TASK, level: 'kernel-up-close' }],
      })
    ).toEqual([
      'timer: unknown field (expected one of: offer, minutes, tasks)',
      'tasks[0].objectives: expected at least one objective',
      'tasks[2].level: expected a level folder like 05-kernel-up-close, got "kernel-up-close"',
      'tasks: "05-kernel-up-close" appears more than once',
    ])
  })

  it('needs at least one task and a length of at least a minute', () => {
    expect(errorsOf({ ...PLACEMENT, minutes: 0, tasks: [] })).toEqual([
      'tasks: expected at least one task',
      'minutes: expected a number from 1 to 9007199254740991, got 0',
    ])
  })
})
