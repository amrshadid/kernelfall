import type { CallFocus, CallGroup, XrayCall } from '@features/xray/types'
import { toXrayCalls } from '@features/xray/utils/calls'
import { appContent, xrayContent } from '@kernelfall/levels/utils'
import { describe, expect, it } from 'vitest'
import { machineOutput } from '@/test/fixtures/machine-facts.fixture'
import { recordedCommand } from '@/test/fixtures/recorded-runs.fixture'
import { runOf } from '@/test/fixtures/trace-events.fixture'
import { callFocusOf } from './call-focus.util'
import { callGroupsOf, leadCallId, lessonCalls } from './call-groups.util'
import { MACHINE_PATH } from './call-list.constants'

const P3 = 'prologue-boot-path-03-speak-to-shell'
const P7 = 'prologue-machine-in-section-07-who-runs'
const S4 = 'prologue-surface-survey-04-finding-things'
const S5 = 'prologue-surface-survey-05-text-tools'
const THREE_YES = 'yes > /dev/null & yes > /dev/null & yes > /dev/null & sleep 4; top -b -n 1 | head -12; kill %1 %2 %3'

function levelFocus(id: string): CallFocus {
  const loaded = appContent()
  if (!loaded.ok) {
    throw new Error(loaded.errors.join('\n'))
  }
  return callFocusOf(loaded.value.game.level(id) ?? null)
}

async function groupsOf(level: string, commandLine: string, focus: CallFocus = [], run = 'solution') {
  const { events } = await recordedCommand(level, run, commandLine)
  const traced = runOf(events, commandLine)
  const calls = toXrayCalls(traced, events, xrayContent())
  return { groups: callGroupsOf(traced, calls, events, focus), calls }
}

// One line per row: a call by name (* when the level teaches it), a fold as "▸ label · n".
const outline = (group: CallGroup | undefined) =>
  (group?.rows ?? []).map((row) =>
    row.kind === 'call' ? `${row.focused ? '*' : ''}${row.call.name}` : `▸ ${row.label} · ${row.calls.length}`
  )

const flat = (group: CallGroup): readonly XrayCall[] =>
  group.rows.flatMap((row) => (row.kind === 'call' ? [row.call] : row.calls))

const titles = (groups: readonly CallGroup[]) => groups.map((g) => `${g.open ? '▾' : '▸'} ${g.title}`)

describe('callGroupsOf on runs recorded on the Machine', () => {
  it("knows the Machine's PATH, the folders a PATH search looks in", async () => {
    expect(MACHINE_PATH).toBe(await machineOutput('echo "$PATH"'))
  })

  it('P.2 /bin/echo: the shell folded away, echo open, its 17 start-up calls in one row', async () => {
    // P.3's recording runs the same BusyBox /bin/echo the P.2 chip does.
    const { groups } = await groupsOf(
      P3,
      '/bin/echo one two three four',
      levelFocus('prologue-boot-path-02-first-words')
    )
    expect(titles(groups)).toEqual(['▸ the shell (bash, PID 480)', '▾ the program (echo, PID 491)'])
    const [shell, echo] = groups
    expect(shell?.facts).toEqual(['fork → PID 491'])
    expect(echo?.facts).toEqual(['forked by PID 480', 'execve /bin/echo', 'exit 0'])
    expect(outline(echo)).toEqual(["▸ bash's bookkeeping · 36", '*execve', '▸ start-up · 17', '*write', '*exit_group'])
    const startUp = echo?.rows[2]
    expect(startUp?.kind === 'fold' && [...new Set(startUp.calls.map((c) => c.name))]).toEqual([
      'set_thread_area',
      'set_tid_address',
      'brk',
      'mmap2',
      'mprotect',
      'getuid32',
      'getgid32',
      'rt_sigprocmask',
      'setgid32',
      'setuid32',
    ])
    expect(outline(shell)).toEqual([
      "▸ bash's bookkeeping · 4",
      'fork',
      "▸ bash's bookkeeping · 10",
      'wait4',
      "▸ bash's bookkeeping · 6",
      'wait4',
      'sigreturn',
    ])
    const write = lessonCalls(groups).find((c) => c.name === 'write')
    expect(leadCallId(groups)).toBe(write?.id)
  })

  it('P.3 hello not found: the PATH search is one row, the copy of the shell writes the error', async () => {
    const { groups } = await groupsOf(P3, 'hello')
    expect(titles(groups)).toEqual(['▸ the shell (bash, PID 480)', '▾ a copy of the shell (bash, PID 503)'])
    expect(outline(groups[0])[0]).toBe('▸ looks up hello in PATH · 7')
    const search = groups[0]?.rows[0]
    expect(search?.kind === 'fold' && search.calls.map((c) => c.path)).toEqual([
      '.',
      '/usr/local/sbin/hello',
      '/usr/local/bin/hello',
      '/usr/sbin/hello',
      '/usr/bin/hello',
      '/sbin/hello',
      '/bin/hello',
    ])
    expect(groups[1]?.facts).toEqual(['forked by PID 480', 'exit 127'])
    expect(outline(groups[1])).toEqual(["▸ bash's bookkeeping · 36", 'writev', 'writev', 'writev', 'exit_group'])
  })

  it('S.4 find /: the redirect stays in sight and 46,720 calls of the walk are one row', async () => {
    const { groups, calls } = await groupsOf(S4, 'find / -name passwd 2>/dev/null')
    expect(calls.length).toBeGreaterThan(40_000)
    const find = groups[1]
    expect(find?.title).toBe('the program (find, PID 622)')
    expect(outline(find)).toEqual([
      "▸ bash's bookkeeping · 36",
      'open',
      'dup2',
      'close',
      'execve',
      '▸ start-up · 17',
      '▸ statx, getdents64, open and 8 more · 46720',
    ])
  })

  it("S.4 a fresh shell: readline's terminfo lookup is its own row, not a PATH search", async () => {
    const { groups } = await groupsOf(S4, 'find attic -name lantern-plan.txt')
    const shell = groups[0]
    expect(shell?.title).toBe('the shell (bash, PID 613)')
    expect(outline(shell).slice(0, 5)).toEqual([
      "▸ reads the terminal's description (terminfo) · 18",
      'open',
      'open',
      'statx',
      '▸ looks up find in PATH · 7',
    ])
    const terminfo = shell?.rows[0]
    expect(terminfo?.kind === 'fold' && terminfo.fold).toBe('terminfo')
    expect(terminfo?.kind === 'fold' && terminfo.calls.flatMap((c) => (c.path ? [c.path] : []))).toEqual([
      '/home/you/.terminfo',
      '/etc/terminfo',
      '/usr/share/terminfo',
      '/lib/terminfo',
      '/usr/lib/terminfo',
      '/etc/terminfo/x/xterm-256color',
      '/etc/terminfo/x/xterm-256color',
    ])
    expect(outline(shell).filter((row) => row.includes('in PATH'))).toEqual(['▸ looks up find in PATH · 7'])
  })

  it('S.5 sort | uniq -c: the pipeline pipe and each dup2 are rows, the sync pipe is bookkeeping', async () => {
    const { groups } = await groupsOf(S5, 'sort census.txt | uniq -c')
    expect(titles(groups)).toEqual([
      '▸ the shell (bash, PID 489)',
      '▾ the program (sort, PID 508)',
      '▾ the program (uniq, PID 509)',
    ])
    expect(groups[0]?.facts).toEqual(['fork → PIDs 508, 509'])
    expect(outline(groups[0]).slice(0, 3)).toEqual(['pipe', "▸ bash's bookkeeping · 6", 'fork'])
    expect(outline(groups[1])).toContain('dup2')
    expect(outline(groups[2])).toContain('dup2')
    expect(outline(groups[2])).toContain('▸ writev × 5 · 5')
  })

  it('P.7 three yes: each yes is a dozen rows, its writes one "× n" row', async () => {
    const { groups } = await groupsOf(P7, THREE_YES)
    const yes = groups.filter((g) => g.title.startsWith('the program (yes'))
    expect(yes).toHaveLength(3)
    for (const group of yes) {
      expect(group.rows.length).toBeLessThan(12)
      expect(outline(group).at(-1)).toMatch(/^▸ writev × \d{3} · \d{3}$/)
      expect(group.facts.at(-1)).toBe('killed by SIGKILL')
    }
    expect(groups.every((g) => g.rows.length <= 60)).toBe(true)
  })

  it('folds without losing a call: every group holds its calls once, in order', async () => {
    const runs = await Promise.all([
      groupsOf(P3, '/bin/echo one two three four'),
      groupsOf(P3, 'hello'),
      groupsOf(S4, 'find / -name passwd 2>/dev/null'),
      groupsOf(S4, 'find attic -name lantern-plan.txt'),
      groupsOf(S5, 'sort census.txt | uniq -c'),
      groupsOf(P7, THREE_YES),
    ])
    for (const { groups, calls } of runs) {
      const ids = groups.flatMap((g) => flat(g).map((c) => c.id))
      expect(ids).toHaveLength(calls.length)
      expect(new Set(ids).size).toBe(calls.length)
      for (const group of groups) {
        expect(flat(group).map((c) => c.id)).toEqual(calls.filter((c) => c.pid === group.pid).map((c) => c.id))
        expect(group.count).toBe(flat(group).length)
      }
    }
  })

  it('never folds a call the level teaches: a focused call breaks the bookkeeping around it', async () => {
    const { groups } = await groupsOf(S5, 'sort census.txt | uniq -c', [{ names: ['pipe', 'setpgid'] }])
    expect(groups[0]?.open).toBe(true)
    expect(outline(groups[0]).filter((row) => row === '*pipe')).toHaveLength(2)
    expect(outline(groups[0])).toContain('*setpgid')
    expect(groups[1]?.open).toBe(true)
  })

  it('keeps a taught PATH search one row, and opens the shell for it', async () => {
    const { groups } = await groupsOf(P3, 'hello', [{ names: ['statx'] }])
    expect(groups[0]?.open).toBe(true)
    expect(groups[0]?.rows[0]).toMatchObject({ kind: 'fold', fold: 'path-search', focused: true })
    expect(groups[0]?.rows[0]?.kind === 'fold' && groups[0].rows[0].calls).toHaveLength(7)
  })
})
