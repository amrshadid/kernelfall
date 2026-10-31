// What `pnpm vm:record` plays on the real Machine, and the tests read back from runs/. Plain data, so
// the recorder runs it in Node and the tests in Vitest.

/** A file put in /home/you before the first line: a path under content/, or one with text replaced. */
export type RunFile = string | { readonly from: string; readonly edits: readonly (readonly [string, string])[] }

/**
 * One line typed at bash's prompt, then each `input` line once the program it started reads the
 * terminal. With `as`, root runs it as that user on the control channel instead (init's knock, as
 * `useRunAs()` does in the game), traced apart from the player's shell.
 */
export interface TypedLine {
  readonly line: string
  readonly input?: readonly string[]
  readonly as?: string
  /** A step before the lines judged, like a build: typed and waited for, but not saved. */
  readonly record?: false
}

/**
 * Raw keys for whatever has the terminal (GRUB's menu and editor: `e`, `\x05` Ctrl-E, `\x18`
 * Ctrl-X), then a wait until the screen shows `until`, or bash's prompt; `until: ''` waits a
 * second (GRUB's wrapped lines may never show the text whole). Never saved.
 */
export interface KeysLine {
  readonly keys: string
  readonly until?: string
}

export type RunLine = TypedLine | KeysLine

export interface ReferenceRun {
  readonly level: string
  /** The fixture's name: `solution` for init's version, or the mistake it shows. */
  readonly name: string
  readonly files?: Readonly<Record<string, RunFile>>
  /** Typed after `script`. */
  readonly lines?: readonly RunLine[]
  /** A content file whose lines are typed first, one command each; `#` lines are comments. */
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
const HELLO_STARTER = `${BOOT_PATH}/02-first-words/starter/hello.c`
const HELLO_AGAIN = `${BOOT_PATH}/03-speak-to-shell/solution/hello.c`

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

/** GRUB's editor opens on `setparams`: Ctrl-N seven times reaches the `linux` line, Ctrl-E its end. */
const LINUX_LINE_END = `${'\x0e'.repeat(7)}\x05`
/** `e` on the menu's entry, `erase` backspaced off the end of the `linux` line, `add` typed, Ctrl-X. */
const grubEdit = (erase: string, add: string): RunLine[] => [
  { keys: 'e', until: 'setparams' },
  { keys: `${LINUX_LINE_END}${'\x7f'.repeat(erase.length)}${add}`, until: '' },
  { keys: '\x18' },
]
const BRING_UP_FAULTS = ' root=/dev/sda3 module_blacklist=virtio_net mem=64M'
/** P.10's first boot: the initramfs's emergency shell (untraced, so keys), read, then `reboot -f` to GRUB. */
const BRING_UP_RESCUE: RunLine[] = [
  { keys: '\r', until: "Type 'exit' to try again." },
  ...['cat /proc/cmdline', 'ls /dev', 'free'].map((line) => ({ keys: `${line}\n`, until: '' })),
  { keys: 'reboot -f\n', until: 'GNU GRUB' },
  { keys: '', until: '' },
]

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
    files: { 'hello.c': { from: HELLO_STARTER, edits: [['return 0;', 'return 0']] } },
    lines: typed(runButton('hello.c')),
  },
  {
    level: 'prologue-boot-path-02-first-words',
    name: 'silent',
    files: { 'hello.c': HELLO_STARTER },
    lines: typed(runButton('hello.c')),
  },
  {
    level: 'prologue-boot-path-02-first-words',
    name: 'no-newline',
    files: { 'hello.c': { from: HELLO, edits: [['hello, Machine\\n', 'hello, Machine']] } },
    lines: typed(runButton('hello.c')),
  },
  {
    level: 'prologue-boot-path-02-first-words',
    name: 'solution',
    files: { 'hello.c': HELLO },
    lines: typed(runButton('hello.c')),
  },
  {
    // musl's printf() writes with writev, not write.
    level: 'prologue-boot-path-02-first-words',
    name: 'solution-printf',
    files: {
      'hello.c': {
        from: HELLO,
        edits: [
          ['#include <unistd.h>', '#include <stdio.h>\n#include <unistd.h>'],
          ['write(STDOUT_FILENO, msg, len)', 'printf("%s", msg)'],
        ],
      },
    },
    lines: typed(runButton('hello.c')),
  },
  {
    level: 'prologue-boot-path-03-speak-to-shell',
    name: 'solution',
    files: { 'hello.c': HELLO_AGAIN },
    lines: [
      built('hello.c'),
      ...typed(
        '/bin/echo one two three four',
        'ls -la',
        'wc -l /etc/motd',
        // The pager waits for q on /dev/tty, which the recorder can't answer; players page as usual.
        'MANPAGER=cat man ls',
        'MANPAGER=cat man wc',
        'MANPAGER=cat man 2 write',
        // Tab finishes a file in /etc, then a command in a folder of PATH.
        'cat /etc/mot\t',
        'printen\t HOME',
        'env GREETING=hi printenv GREETING',
        'hello',
        './hello'
      ),
    ],
  },
  {
    // Every errand almost done, so nothing is met.
    level: 'prologue-boot-path-03-speak-to-shell',
    name: 'near-misses',
    files: { 'hello.c': HELLO_AGAIN },
    lines: typed(
      'echo one two three four',
      'ls -l -a',
      'wc /etc/motd',
      'GREETING=hi printenv GREETING',
      'cat /etc/motd',
      // Globs read the same folders as Tab, but after Enter.
      'cat /etc/mo*',
      'echo /usr/bin/printen*',
      '/usr/local/bin/hello'
    ),
  },
  ...(
    [
      ['solution', grubEdit('quiet', 'initcall_debug greeting=hello')],
      // quiet only quiets the console: dmesg still holds every line.
      ['kept-quiet', grubEdit('', ' initcall_debug greeting=hello')],
      ['plain-boot', [{ keys: '\r' }]],
    ] satisfies [string, RunLine[]][]
  ).map(([name, boot]) => ({
    level: 'prologue-boot-path-04-the-boot-path',
    name,
    lines: [
      ...boot,
      ...typed(
        'cat /proc/cmdline',
        'dmesg | grep -i "command line"',
        'dmesg | grep -m 4 "calling  "',
        'ls /sys/firmware/efi'
      ),
    ],
  })),
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
    // A crash on a user address, and the answer typed in without asking the kernel.
    level: 'prologue-machine-in-section-05-kernel-up-close',
    name: 'impostors',
    files: {
      'poke.c': {
        from: `${MACHINE}/05-kernel-up-close/starter/poke.c`,
        edits: [['#define KERNEL_SPACE 0xc0000000UL', '#define KERNEL_SPACE 0x0UL']],
      },
      'myuname.c': {
        from: `${MACHINE}/05-kernel-up-close/solution/myuname.c`,
        edits: [
          [
            '\tif (uname(&u) < 0)\n\t\treturn 1;\n\tprintf("%s %s %s\\n", u.sysname, u.release, u.machine);',
            '\t(void)u;\n\tprintf("Linux 6.18.59-0-virt i686\\n");',
          ],
        ],
      },
    },
    lines: [built('poke.c'), built('myuname.c'), ...typed('./poke', './myuname')],
  },
  {
    level: 'prologue-machine-in-section-05-kernel-up-close',
    name: 'starter',
    files: { 'myuname.c': `${MACHINE}/05-kernel-up-close/starter/myuname.c` },
    lines: [built('myuname.c'), ...typed('./myuname', 'uname -sr')],
  },
  ...['solution', 'starter'].map((name) => ({
    level: 'prologue-machine-in-section-06-finding-the-hardware',
    name,
    files: { 'lighthouse.dts': `${MACHINE}/06-finding-the-hardware/${name}/lighthouse.dts` },
    lines: typed(
      ...(name === 'solution' ? ['readlink /sys/bus/pci/devices/0000:00:1e.0/driver'] : []),
      'dtc -I dts -O dtb -o lighthouse.dtb lighthouse.dts',
      'board lighthouse.dtb'
    ),
  })),
  {
    level: 'prologue-machine-in-section-07-who-runs',
    name: 'solution',
    files: { 'mypid.c': `${MACHINE}/07-who-runs/solution/mypid.c` },
    lines: [
      built('mypid.c'),
      ...typed(
        'cat /proc/$$/status',
        'yes > /dev/null & yes > /dev/null & yes > /dev/null & sleep 4; top -b -n 1 | head -12; kill %1 %2 %3',
        './mypid',
        './mypid'
      ),
    ],
  },
  {
    level: 'prologue-machine-in-section-07-who-runs',
    name: 'starter',
    files: { 'mypid.c': `${MACHINE}/07-who-runs/starter/mypid.c` },
    lines: [built('mypid.c'), ...typed('yes > /dev/null & sleep 2; top -b -n 1 | head -12; kill %1', './mypid')],
  },
  {
    level: 'prologue-machine-in-section-08-pages-and-maps',
    name: 'solution',
    files: { 'where.c': `${MACHINE}/08-pages-and-maps/solution/where.c` },
    lines: [built('where.c'), ...typed('cat /proc/meminfo', 'free', './where')],
  },
  {
    level: 'prologue-machine-in-section-08-pages-and-maps',
    name: 'starter',
    files: { 'where.c': `${MACHINE}/08-pages-and-maps/starter/where.c` },
    lines: [built('where.c'), ...typed('./where')],
  },
  ...[
    ['9p', '/etc/motd'],
    ['procfs', '/proc/uptime'],
    ['sysfs', '/sys/class/net/eth0/address'],
  ].map(([name = '', path = '']) => ({
    level: 'prologue-machine-in-section-09-files-doors-wires',
    name: `solution-${name}`,
    files: look(path),
    lines: [built('look.c'), ...typed('./look')],
  })),
  {
    // The null driver answers end of file at once: nothing read, nothing to judge.
    level: 'prologue-machine-in-section-09-files-doors-wires',
    name: 'dev-null',
    files: look('/dev/null'),
    lines: [built('look.c'), ...typed('./look')],
  },
  {
    level: 'prologue-machine-in-section-10-bring-it-up',
    name: 'solution',
    lines: [
      ...BRING_UP_RESCUE,
      ...grubEdit(BRING_UP_FAULTS, ''),
      ...typed('cat /proc/cmdline', 'free', 'ls /sys/class/net', 'readlink /sys/class/net/eth0/device/driver'),
      // The level's runAs cue, once card-bound is met.
      { line: 'ip link set eth0 up', as: 'root' },
      ...typed('cat /sys/class/net/eth0/operstate', 'ps'),
    ],
  },
  {
    // Only root= fixed: the Machine comes up without its network driver and with 64 MiB.
    level: 'prologue-machine-in-section-10-bring-it-up',
    name: 'root-only',
    lines: [
      ...BRING_UP_RESCUE,
      ...grubEdit(BRING_UP_FAULTS, ' module_blacklist=virtio_net mem=64M'),
      ...typed(
        'cat /proc/cmdline',
        'free',
        'ls /sys/class/net',
        'readlink /sys/class/net/eth0/device/driver',
        'cat /sys/class/net/eth0/operstate',
        'ps'
      ),
    ],
  },
  ...['01-streets', '02-who-may-enter', '03-processes', '04-finding-things', '05-text-tools'].map((folder) => ({
    level: `prologue-surface-survey-${folder}`,
    name: 'solution',
    script: `${SURVEY}/${folder}/solution/commands.sh`,
    // init's knock, once the note is private: the neighbour tries to read it.
    ...(folder === '02-who-may-enter' && { lines: [{ line: 'cat /home/you/notes.txt', as: 'guest' }] }),
  })),
  {
    // A copy and a delete instead of a rename, and the wrong tree left behind.
    level: 'prologue-surface-survey-01-streets',
    name: 'copy-not-rename',
    lines: typed(
      'mkdir -p /tmp/survey/maps /tmp/survey/notes',
      'cp /etc/motd /tmp/survey/maps/motd',
      'cp /tmp/survey/maps/motd /tmp/survey/maps/motd.old',
      'rm /tmp/survey/maps/motd',
      'ls -R /tmp/survey'
    ),
  },
  {
    // The walk's stops reached without a `..` or a relative path the kernel walks.
    level: 'prologue-surface-survey-01-streets',
    name: 'no-dots',
    lines: typed('cd /etc', 'cat motd', 'cd /', 'cd home/you', 'cat /etc/motd'),
  },
  {
    // A refused execve of a file that was never a program.
    level: 'prologue-surface-survey-02-who-may-enter',
    name: 'not-hi',
    lines: typed('./notes.txt'),
  },
  {
    // ps without its COMMAND column names no one, so it can't show a process gone; /proc/1 is init's.
    level: 'prologue-surface-survey-03-processes',
    name: 'pids-only',
    lines: typed('cat /proc/1/status', 'kill $(pidof yes)', 'kill $(pidof sleep)', 'ps -o pid'),
  },
  {
    // Standard error into a file, not thrown away.
    level: 'prologue-surface-survey-04-finding-things',
    name: 'errors-to-file',
    lines: typed('find /root /etc -name passwd 2> errors.txt'),
  },
  {
    // Counting through a pipe: the lit houses, the words, then the dark houses.
    level: 'prologue-surface-survey-05-text-tools',
    name: 'piped-count',
    lines: typed('grep lit census.txt | wc -l', 'grep dark census.txt | wc -w', 'grep dark census.txt | wc -l'),
  },
  {
    level: 'prologue-surface-survey-02-who-may-enter',
    name: 'not-private',
    lines: typed('chmod 640 notes.txt', 'ls -l notes.txt', 'chmod 000 notes.txt', 'ls -l notes.txt'),
  },
  {
    level: 'prologue-surface-survey-03-processes',
    name: 'kill-without-stop',
    lines: typed('kill $(pidof yes)', 'cat /proc/$$/status', 'ps -o pid,stat,comm'),
  },
  {
    level: 'prologue-surface-survey-04-finding-things',
    name: 'results-away',
    // /root and /etc: a refusal and the result, without walking all of /proc.
    lines: typed("find attic -name '*.txt'", 'find /root /etc -name passwd > found.txt'),
  },
  {
    level: 'prologue-surface-survey-05-text-tools',
    name: 'unsorted',
    lines: typed('uniq -c census.txt', 'cat census.txt | uniq -c', 'sort -r census.txt > sorted.txt'),
  },
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
