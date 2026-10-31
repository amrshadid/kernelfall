import { describe, expect, it } from 'vitest'
import { PROCESS_STAGE_KEYS, SYSCALL_STAGE_KEYS } from '#types/index'
import { loadXrayContent } from '#utils/xray/xray-content.util'
import { XRAY_FILES } from '#utils/xray/xray-files.util'

const WRITE = `
write:
  family: write
  args: [fd, buf, count]
  pointers: [1]
  path: [__x64_sys_write, ksys_write]
  sources:
    - { path: fs/read_write.c, fn: ksys_write() }
  desk: Writes your bytes
  returns: the number of bytes written
`

/** The shipped narration with `syscalls.yaml` replaced. */
const withSyscalls = (syscalls: string) => loadXrayContent({ syscalls, narration: XRAY_FILES.narration })

function errorsOf(result: ReturnType<typeof loadXrayContent>): readonly string[] {
  return result.ok ? [] : result.errors
}

describe('loadXrayContent', () => {
  it('accepts the content that ships with the game', () => {
    const result = loadXrayContent(XRAY_FILES)
    expect(errorsOf(result)).toEqual([])
    expect(result.ok && result.value.syscalls.get('write')?.family).toBe('write')
  })

  it('reads a syscall with every field, and fills the defaults for a short one', () => {
    const result = withSyscalls(
      `${WRITE}\ngetpid:\n  args: []\n  path: [__x64_sys_getpid]\n  sources: []\n  desk: Looks up the PID\n`
    )
    expect(errorsOf(result)).toEqual([])
    if (!result.ok) {
      return
    }
    expect(result.value.syscalls.get('write')).toEqual({
      name: 'write',
      family: 'write',
      args: ['fd', 'buf', 'count'],
      pointers: [1],
      pathArg: null,
      path: ['__x64_sys_write', 'ksys_write'],
      sources: [{ path: 'fs/read_write.c', fn: 'ksys_write()' }],
      desk: 'Writes your bytes',
      returns: 'the number of bytes written',
    })
    expect(result.value.syscalls.get('getpid')).toMatchObject({ family: 'generic', pointers: [], returns: null })
  })

  it('reports a bad name, an unknown family, a typo and an argument that does not exist', () => {
    const errors = errorsOf(
      withSyscalls(
        `Write:\n  family: copy\n  args: [fd]\n  pointers: [3]\n  path: []\n  sources: []\n  desk: x\n  dsek: y\n`
      )
    )
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('expected a syscall name like wait4, got "Write"'),
        expect.stringContaining('syscalls.yaml.Write.family'),
        expect.stringContaining('syscalls.yaml.Write.dsek: unknown field'),
        expect.stringContaining('argument 3 is named, but the call has only 1 arguments'),
      ])
    )
  })

  it('reports YAML that does not parse, naming the file', () => {
    expect(errorsOf(withSyscalls('write: [unclosed'))).toEqual([
      expect.stringMatching(/^syscalls\.yaml: not valid YAML/),
    ])
  })

  it('needs every stage the storyboards tell', () => {
    const narration = XRAY_FILES.narration.replace(/\n {2}sysret-exec:\n(?: {4}.*\n| {6}.*\n)+/, '\n')
    const errors = errorsOf(loadXrayContent({ syscalls: WRITE, narration }))
    expect(errors).toEqual([expect.stringContaining('narration.yaml.syscall-stages.sysret-exec')])
  })

  it('knows a stage key for every stage of both views', () => {
    const result = loadXrayContent(XRAY_FILES)
    if (!result.ok) {
      throw new Error(result.errors.join('\n'))
    }
    expect(Object.keys(result.value.narration.syscallStages)).toEqual([...SYSCALL_STAGE_KEYS])
    expect(Object.keys(result.value.narration.processStages)).toEqual([...PROCESS_STAGE_KEYS])
  })
})
