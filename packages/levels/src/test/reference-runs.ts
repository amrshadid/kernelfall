// What `pnpm vm:record` plays on the real Machine, and the tests read back from runs/. Plain data, so
// the recorder runs it in Node and the tests in Vitest.

/** A file put in /home/you before the first line: a path under content/, or one with text replaced. */
export type RunFile = string | { readonly from: string; readonly edits: readonly (readonly [string, string])[] }

/** One line typed at bash's prompt, then each `input` line once the program it started reads the terminal. */
export interface RunLine {
  readonly line: string
  readonly input?: readonly string[]
  /** A step before the lines judged, like a build: typed and waited for, but not saved. */
  readonly record?: false
}

export interface ReferenceRun {
  readonly level: string
  /** The fixture's name: `solution` for init's version, or the mistake it shows. */
  readonly name: string
  readonly files?: Readonly<Record<string, RunFile>>
  readonly lines?: readonly RunLine[]
  /** A content file whose lines are typed after `lines`, one command each; `#` lines are comments. */
  readonly script?: string
}

/** The editor's Run button: gcc with the warnings the levels expect clean, then the program. */
const runButton = (source: string): string => `${build(source)} && ./${source.replace(/\.c$/, '')}`
const build = (source: string): string => `gcc -Wall -Wextra ${source} -o ${source.replace(/\.c$/, '')}`
/** A build typed before the judged lines, which keeps gcc's thousands of events out of the fixture. */
const built = (source: string): RunLine => ({ line: build(source), record: false })
const typed = (...lines: string[]): RunLine[] => lines.map((line) => ({ line }))

const PROLOGUE = '0-prologue'
const BOOT_PATH = `${PROLOGUE}/1-boot-path`
const MACHINE = `${PROLOGUE}/2-machine-in-section`
const SURVEY = `${PROLOGUE}/3-surface-survey`

const HELLO = `${BOOT_PATH}/02-first-words/solution/hello.c`

const KSH = '1-act-1/2-process-district/04-run-anything'
const RUN_ANYTHING = 'act1-process-district-04-run-anything'
const ksh = (from: string, ...edits: (readonly [string, string])[]): Readonly<Record<string, RunFile>> => ({
  'ksh-lite.c': edits.length === 0 ? `${KSH}/${from}/ksh-lite.c` : { from: `${KSH}/${from}/ksh-lite.c`, edits },
})
const KSH_FLUSH = ['\t\t/* stdout holds text until a newline, and the prompt has none. */\n\t\tfflush(stdout);\n', '']
const KSH_EXIT = ['_exit(STATUS_NOT_FOUND);', 'exit(STATUS_NOT_FOUND);'] as const
/** Ten commands, so no-zombies can be judged, then `false` and `exit`. */
const KSH_SESSION = [
  'ls /',
  '/bin/echo a b',
  'nosuch',
  'true',
  'pwd',
  'ls',
  'echo hi',
  'cat /etc/motd',
  '',
  'printenv HOME',
  'false',
  'exit',
]
/** RLIMIT_NPROC of 1 leaves the player no process to spare, so the shell's fork() fails (story.md). */
const KSH_NO_FORK = { line: '(ulimit -u 1; exec ./ksh-lite)', input: ['ls /', 'exit'] }

const look = (path: string): Readonly<Record<string, RunFile>> => ({
  'look.c': {
    from: `${MACHINE}/09-files-doors-wires/solution/look.c`,
    edits: [['"/sys/class/net/eth0/address"', `"${path}"`]],
  },
})

export const REFERENCE_RUNS: readonly ReferenceRun[] = [
  {
    level: 'prologue-boot-path-01-power-on',
    name: 'solution',
    lines: typed(
      'echo hello',
      'echo the lamps are out',
      'ls /',
      'ls /bin',
      'cat /etc/motd',
      'cat /etc/hostname',
      'ls /dev',
      'cat /proc/version'
    ),
  },
  {
    level: 'prologue-boot-path-02-first-words',
    name: 'broken',
    files: { 'hello.c': { from: HELLO, edits: [['return 0;', 'return 0']] } },
    lines: typed(runButton('hello.c')),
  },
  {
    level: 'prologue-boot-path-02-first-words',
    name: 'solution',
    files: { 'hello.c': HELLO },
    lines: typed(runButton('hello.c')),
  },
  {
    level: 'prologue-boot-path-03-speak-to-shell',
    name: 'solution',
    files: { 'hello.c': `${BOOT_PATH}/03-speak-to-shell/solution/hello.c` },
    lines: [
      built('hello.c'),
      ...typed(
        '/bin/echo one two three four',
        'ls -la /etc',
        'wc -l /etc/motd',
        // The pager waits for q on /dev/tty, which the recorder can't answer; players page as usual.
        'MANPAGER=cat man ls',
        'MANPAGER=cat man wc',
        'MANPAGER=cat man 1 ls',
        // Tab finishes a file in /etc, then a command in a folder of PATH.
        'cat /etc/mot\t',
        'printen\t HOME',
        'env GREETING=hello printenv GREETING',
        './hello'
      ),
    ],
  },
  {
    level: 'prologue-machine-in-section-05-kernel-up-close',
    name: 'solution',
    files: {
      'poke.c': `${MACHINE}/05-kernel-up-close/starter/poke.c`,
      'myuname.c': `${MACHINE}/05-kernel-up-close/solution/myuname.c`,
    },
    lines: [built('poke.c'), built('myuname.c'), ...typed('./poke', './myuname', 'uname -srm')],
  },
  {
    level: 'prologue-machine-in-section-07-who-runs',
    name: 'solution',
    files: { 'whoami.c': `${MACHINE}/07-who-runs/solution/whoami.c` },
    lines: [built('whoami.c'), ...typed('cat /proc/self/status', './whoami', './whoami')],
  },
  {
    level: 'prologue-machine-in-section-08-pages-and-maps',
    name: 'solution',
    files: { 'where.c': `${MACHINE}/08-pages-and-maps/solution/where.c` },
    lines: [built('where.c'), ...typed('cat /proc/meminfo', './where')],
  },
  ...[
    ['ext4', '/etc/motd'],
    ['procfs', '/proc/uptime'],
    ['sysfs', '/sys/class/net/eth0/address'],
  ].map(([name = '', path = '']) => ({
    level: 'prologue-machine-in-section-09-files-doors-wires',
    name: `solution-${name}`,
    files: look(path),
    lines: [built('look.c'), ...typed('./look')],
  })),
  ...['01-streets', '02-who-may-enter', '03-processes', '04-finding-things', '05-text-tools'].map((folder) => ({
    level: `prologue-surface-survey-${folder}`,
    name: 'solution',
    script: `${SURVEY}/${folder}/solution/commands.sh`,
  })),
  {
    level: RUN_ANYTHING,
    name: 'solution',
    files: ksh('solution'),
    lines: [{ line: runButton('ksh-lite.c'), input: KSH_SESSION }],
  },
  {
    level: RUN_ANYTHING,
    name: 'solution-not-found-exit',
    files: ksh('solution'),
    lines: [built('ksh-lite.c'), { line: './ksh-lite', input: ['nosuch', 'exit'] }],
  },
  {
    level: RUN_ANYTHING,
    name: 'solution-fork-fails',
    files: ksh('solution'),
    lines: [built('ksh-lite.c'), KSH_NO_FORK],
  },
  {
    level: RUN_ANYTHING,
    name: 'starter',
    files: ksh('starter'),
    lines: [built('ksh-lite.c'), { line: './ksh-lite', input: ['ls /', 'exit'] }],
  },
  {
    level: RUN_ANYTHING,
    name: 'no-wait',
    files: ksh('solution', ['waitpid(pid, &status, 0) < 0', '(status = 0)']),
    lines: [built('ksh-lite.c'), { line: './ksh-lite', input: ['ls /', 'false', 'exit'] }],
  },
  {
    level: RUN_ANYTHING,
    name: 'ignored-fork-error',
    files: ksh('solution', ['if (pid < 0) {', 'if (pid < -1) {']),
    lines: [built('ksh-lite.c'), KSH_NO_FORK],
  },
  {
    // exit() in the child, and a prompt left in stdout's buffer at fork(): the child prints it again.
    level: RUN_ANYTHING,
    name: 'exit-in-child',
    files: ksh('solution', KSH_EXIT, KSH_FLUSH as [string, string]),
    lines: [built('ksh-lite.c'), { line: './ksh-lite', input: ['nosuch', 'exit'] }],
  },
  {
    // exit() in the child, but the prompt was flushed before fork(): nothing is printed twice.
    level: RUN_ANYTHING,
    name: 'exit-in-child-flushed',
    files: ksh('solution', KSH_EXIT),
    lines: [built('ksh-lite.c'), { line: './ksh-lite', input: ['nosuch', 'exit'] }],
  },
]
