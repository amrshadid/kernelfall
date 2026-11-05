import { NO_BREAK } from './crossing.constants'

/** What Simple says about one kind of call; `{name}` placeholders come from the call itself. */
export interface CallSay {
  /** The card's request, in plain words; a path the call carries is printed under it, so it isn't repeated. */
  readonly request: string
  readonly ask: string
  /** The kernel beat when the call works. */
  readonly work: string
  /** The kernel beat instead, when the bytes reached the terminal. */
  readonly console?: string
  /** The answer card's line when the call works. */
  readonly meaning: string
  /** The line for a 0 answer, where 0 says something of its own. */
  readonly zero?: string
  /** Why the kernel refused, by errno, where strerror()'s words aren't enough. */
  readonly refused?: Readonly<Record<string, string>>
  /** The other options of the guess before the answer, or null for no guess. */
  readonly predict: readonly string[] | null
}

const NB = NO_BREAK
const DONE = ['0', '-1']
const COUNT = ['0', '-1']

/** The ENOENT of a call that walks a path: the last name or a folder on the way may be the missing one. */
export const PATH_ENOENT = "a name in {path} doesn't exist"

// Each sentence is checked against Linux 6.18's handler and the call's man page.
export const CALL_SAY: Readonly<Record<string, CallSay>> = {
  open: {
    request: 'open {what} {access}',
    ask: '`{program}` asks the kernel to open {path} {access}.',
    work: 'The VFS walks {path} one folder at a time, checking your permission at each step, and gives this process fd {ret}: the lowest number free in its table.',
    meaning: 'the new fd',
    refused: {
      EACCES: 'the permission bits say no: you may not open {path} {access}',
      EISDIR: '{path} is a folder, and a folder is never opened for writing',
      EEXIST: '{path} already exists',
      ENOTDIR: 'a name on the way to {path} is not a folder',
    },
    predict: DONE,
  },
  read: {
    request: `read up to {count}${NB}{unit} from fd${NB}{fd}`,
    ask: '`{program}` asks the kernel: read up to {count} {unit} from fd {fd}.',
    work: "The kernel finds the open file behind fd {fd} and copies up to {count} {unit} from it into `{program}`'s buffer.",
    meaning: '{ret} {retUnit} read',
    zero: 'end of file',
    refused: {
      EISDIR: "fd {fd} is a folder, and read() doesn't read folders",
      EBADF: "fd {fd} isn't open for reading",
      EAGAIN: 'nothing is ready, and fd {fd} is set not to wait',
    },
    predict: ['{count}', ...COUNT],
  },
  write: {
    request: `write {count}${NB}{unit} to fd${NB}{fd}`,
    ask: "`{program}` can't touch {target} itself, so it asks the kernel: write {count} {unit} to fd {fd}.",
    work: "The kernel finds the open file behind fd {fd} and copies the {count} {unit} from `{program}`'s buffer into it.",
    console:
      'The kernel finds that fd {fd} is your terminal and hands the {count} {unit} to its driver, the tty driver.',
    meaning: '{ret} {retUnit} taken',
    refused: {
      EBADF: "fd {fd} isn't open for writing",
      EPIPE: 'nothing reads the other end any more, so the kernel also sends `{program}` SIGPIPE',
      ENOSPC: 'the disk is full',
    },
    predict: COUNT,
  },
  writev: {
    request: `write {buffers}${NB}buffers to fd${NB}{fd}`,
    ask: "`{program}` can't touch {target} itself, so it asks the kernel: write these {buffers} buffers to fd {fd}, one after another.",
    work: "The kernel copies the {buffers} buffers, in order, from `{program}`'s memory into the open file behind fd {fd}, all in this one call.",
    console:
      'The kernel finds that fd {fd} is your terminal and hands the {buffers} buffers, in order, to its driver, the tty driver.',
    meaning: '{ret} {retUnit} taken',
    refused: {
      EBADF: "fd {fd} isn't open for writing",
      EPIPE: 'nothing reads the other end any more, so the kernel also sends `{program}` SIGPIPE',
    },
    predict: COUNT,
  },
  close: {
    request: `close fd${NB}{fd}`,
    ask: '`{program}` asks the kernel to close fd {fd}.',
    work: "The kernel takes fd {fd} out of this process's table; the open file itself goes once nothing uses it any more.",
    meaning: 'fd {fd} is closed',
    refused: { EBADF: "fd {fd} isn't open" },
    predict: null,
  },
  statx: {
    request: 'the details of this file',
    ask: '`{program}` asks the kernel for the details of {path}: its type, size, owner, permissions and times.',
    work: "The VFS finds {path} and copies its details into `{program}`'s buffer.",
    meaning: 'the details are copied',
    refused: {
      EACCES: 'you may not look inside a folder on the way to {path}',
      ENOTDIR: 'a name on the way to {path} is not a folder',
    },
    predict: DONE,
  },
  'statx-fd': {
    request: `the details of fd${NB}{dfd}`,
    ask: '`{program}` asks the kernel for the details of the file open as fd {dfd}: its type, size, owner, permissions and times.',
    work: "The kernel finds the open file behind fd {dfd} and copies its details into `{program}`'s buffer.",
    meaning: 'the details are copied',
    refused: { EBADF: "fd {dfd} isn't open" },
    predict: DONE,
  },
  getdents64: {
    request: `list the folder at fd${NB}{fd}`,
    ask: '`{program}` asks the kernel for the next entries of the folder open as fd {fd}.',
    work: "The VFS copies the folder's next entries into `{program}`'s buffer, up to {count} bytes: each one a name, an inode number and a type.",
    meaning: '{ret} {retUnit} of entries',
    zero: 'no entries left',
    refused: { ENOTDIR: "fd {fd} isn't a folder" },
    predict: COUNT,
  },
  sendfile64: {
    request: `copy fd${NB}{in} to fd${NB}{out}`,
    ask: '`{program}` asks the kernel to copy fd {in} into fd {out} inside the kernel, up to {max}.',
    work: "The kernel reads from fd {in} and writes to fd {out} inside the kernel: the bytes never pass through `{program}`'s memory.",
    console:
      "The kernel reads from fd {in} and hands the bytes to fd {out}, your terminal, through the tty driver: they never pass through `{program}`'s memory.",
    meaning: '{ret} {retUnit} copied',
    zero: 'nothing left to copy',
    refused: { EINVAL: "these two files can't be copied this way, so nothing moved" },
    predict: COUNT,
  },
  execve: {
    request: 'run this program',
    ask: '`{program}` asks the kernel to run {path} in this process, in its own place.',
    work: "The kernel opens {path}, checks you may run it, throws away this process's memory and loads the new program into it. The PID stays {pid}.",
    meaning: 'now runs {newProgram}',
    refused: {
      EACCES: 'you may not run {path}',
      ENOEXEC: "{path} isn't a program the kernel knows how to load",
    },
    predict: null,
  },
  fork: {
    request: 'make a copy of this process',
    ask: '`{program}` asks the kernel for a copy of itself, a new process.',
    work: 'The kernel makes PID {ret}, a copy of this process: the same program, memory and open files. The memory is shared until either one writes to it.',
    meaning: "the new child's PID",
    refused: { EAGAIN: 'a limit on processes is reached, such as how many your user may run' },
    predict: null,
  },
  'clone-thread': {
    request: 'start a new thread',
    ask: '`{program}` asks the kernel for a new thread in this process.',
    work: 'The kernel makes thread {ret} inside this process: it shares the memory and open files, and runs beside the others.',
    meaning: "the new thread's ID",
    refused: { EAGAIN: 'a limit on processes is reached, such as how many your user may run' },
    predict: null,
  },
  'clone-vm': {
    request: 'make a new process',
    ask: '`{program}` asks the kernel for a new process that borrows its memory.',
    work: "The kernel makes PID {ret}, which shares this process's memory instead of copying it.",
    meaning: "the new child's PID",
    refused: { EAGAIN: 'a limit on processes is reached, such as how many your user may run' },
    predict: null,
  },
  'clone-vfork': {
    request: 'make a new process',
    ask: '`{program}` asks the kernel for a new process that borrows its memory.',
    work: "The kernel makes PID {ret}, which shares this process's memory instead of copying it, and holds `{program}` until the child runs a new program or exits.",
    meaning: "the new child's PID",
    refused: { EAGAIN: 'a limit on processes is reached, such as how many your user may run' },
    predict: null,
  },
  wait4: {
    request: 'wait for {child}',
    ask: '`{program}` asks the kernel to wait for {child} to {end}.',
    work: 'The kernel checks whether {child} has {ended}; if not yet, it puts `{program}` to sleep until then. For a child that ended, it hands over the exit status and frees what was left of it, the zombie.',
    meaning: "the child's PID",
    refused: {
      ECHILD: '`{program}` has no child that matches, so there is nothing to wait for',
      EINTR: 'a signal came first',
    },
    predict: DONE,
  },
  'wait4-nohang': {
    request: 'check on {child}, no waiting',
    ask: '`{program}` asks the kernel whether {child} has {ended}, without waiting.',
    work: 'The kernel checks whether {child} has {ended}, and answers at once instead of waiting. For a child that ended, it hands over the exit status and frees what was left of it, the zombie.',
    meaning: "the child's PID",
    zero: 'none has yet',
    refused: { ECHILD: '`{program}` has no child that matches, so there is nothing to wait for' },
    predict: DONE,
  },
  exit_group: {
    request: `end this process, status${NB}{status}`,
    ask: '`{program}` asks the kernel to end it, with exit status {status}.',
    work: 'The kernel stops every thread of this process, closes its files and frees its memory. It keeps only the exit status, {status}, for the parent to collect.',
    meaning: 'the process is gone',
    predict: null,
  },
  chdir: {
    request: 'move into this folder',
    ask: '`{program}` asks the kernel to make {path} its working directory.',
    work: "The VFS finds the folder {path}, checks you may enter it, and makes it this process's working directory.",
    meaning: 'now in that folder',
    refused: {
      ENOTDIR: '{path} is not a folder',
      EACCES: 'you may not enter {path}, or a folder on the way to it',
    },
    predict: DONE,
  },
  mkdir: {
    request: 'make this folder',
    ask: '`{program}` asks the kernel to make the folder {path}.',
    work: 'The VFS checks you may write in the folder above {path}, then makes {path}, a new, empty folder.',
    meaning: 'the folder is made',
    refused: {
      EEXIST: '{path} already exists',
      ENOENT: "a folder above {path} doesn't exist",
      EACCES: 'you may not write in the folder above {path}',
    },
    predict: DONE,
  },
  rename: {
    request: 'rename or move this',
    ask: '`{program}` asks the kernel to give {path} a new name or folder.',
    work: "The VFS moves the name {path} to its new place. Only names change: the file's bytes stay where they are.",
    meaning: 'moved',
    refused: {
      EXDEV: "the new place is on another filesystem, and rename can't cross filesystems",
      EACCES: 'you may not write in one of the two folders',
    },
    predict: DONE,
  },
  unlink: {
    request: 'remove this name',
    ask: '`{program}` asks the kernel to remove the name {path}.',
    work: 'The VFS takes the name {path} out of its folder. The file itself goes once no other name and no open file uses it.',
    meaning: 'the name is gone',
    refused: {
      EISDIR: '{path} is a folder, and folders go with rmdir',
      EACCES: 'you may not write in the folder that holds {path}',
    },
    predict: DONE,
  },
  rmdir: {
    request: 'remove this empty folder',
    ask: '`{program}` asks the kernel to remove the folder {path}.',
    work: 'The VFS checks that {path} is an empty folder and takes it out of the folder above.',
    meaning: 'the folder is gone',
    refused: {
      ENOTEMPTY: "{path} isn't empty, and rmdir removes only empty folders",
      ENOTDIR: '{path} is not a folder',
      EACCES: 'you may not write in the folder above {path}',
    },
    predict: DONE,
  },
  chmod: {
    request: `set mode${NB}{mode} on this`,
    ask: "`{program}` asks the kernel to set {path}'s permission bits to {mode}.",
    work: 'The VFS checks that you own {path} (or are root) and sets its permission bits to {mode}.',
    meaning: 'the mode is set',
    refused: {
      EPERM: "only the owner of {path}, or root, may change its permission bits, and you aren't its owner",
      EROFS: 'the filesystem is read-only',
    },
    predict: DONE,
  },
  kill: {
    request: 'send {signal} to {whomShort}',
    ask: '`{program}` asks the kernel to send {signal} ({sig}) to {whom}.',
    work: 'The kernel checks you may signal {whom}, then marks {signal} pending there; it takes effect when the receiver next runs.',
    meaning: 'the signal is sent',
    refused: {
      EPERM: "you may signal only your own user's processes (unless you are root), and {whom} isn't one",
      ESRCH: 'there is no {whom}',
    },
    predict: DONE,
  },
  'kill-check': {
    request: 'check on {whomShort}',
    ask: '`{program}` asks the kernel to send signal 0 to {whom}: a check, not a signal.',
    work: 'Signal 0 sends nothing: the kernel only checks that {whom} exists and that you may signal it.',
    meaning: 'it exists, and may be signalled',
    refused: {
      EPERM: "{whom} exists, but you may signal only your own user's processes (unless you are root)",
      ESRCH: 'there is no {whom}',
    },
    predict: DONE,
  },
  pipe: {
    request: 'make a pipe',
    ask: '`{program}` asks the kernel for a pipe.',
    work: 'The kernel makes a pipe, a buffer inside the kernel with two ends, and gives this process two new fds: one to read from, one to write to.',
    meaning: 'two new fds',
    refused: { EMFILE: 'this process has no free fds left' },
    predict: null,
  },
  dup2: {
    request: `make fd${NB}{new} a copy of fd${NB}{old}`,
    ask: '`{program}` asks the kernel to make fd {new} point at the same open file as fd {old}.',
    work: "The kernel closes whatever fd {new} had open, then points fd {new} at fd {old}'s open file: both now share it, and its position.",
    meaning: 'fd {new} shares it now',
    refused: { EBADF: "fd {old} isn't open" },
    predict: ['{old}', ...DONE],
  },
  'dup2-same': {
    request: `make fd${NB}{new} a copy of fd${NB}{old}`,
    ask: '`{program}` asks the kernel to make fd {new} point at the same open file as fd {old}.',
    work: 'fd {old} and fd {new} are the same fd, so the kernel only checks that it is open.',
    meaning: 'nothing to change',
    refused: { EBADF: "fd {old} isn't open" },
    predict: null,
  },
  uname: {
    request: "the kernel's name and version",
    ask: '`{program}` asks the kernel for its name, release, version and machine type.',
    work: "The kernel copies its name (Linux), its release, version and machine type, and this Machine's hostname, into `{program}`'s buffer.",
    meaning: 'the names are copied',
    predict: null,
  },
  getpid: {
    request: "this process's ID",
    ask: '`{program}` asks the kernel for its own process ID.',
    work: "The kernel reads this process's ID from its own record of the process.",
    meaning: "this process's PID",
    predict: ['0', '1'],
  },
  getppid: {
    request: "the parent's process ID",
    ask: "`{program}` asks the kernel for its parent's process ID.",
    work: "The kernel looks up which process is this one's parent and reads that process's ID.",
    meaning: "the parent's PID",
    predict: ['{pid}', '1'],
  },
  nanosleep: {
    request: 'sleep for a set time',
    ask: '`{program}` asks the kernel to put it to sleep for a set time.',
    work: 'The kernel sets a timer and takes `{program}` off the CPU; the CPU goes to other work, or idles, until the timer fires and wakes it.',
    meaning: 'the time has passed',
    refused: { EINTR: 'a signal woke it early' },
    predict: null,
  },
  'syslog-size': {
    request: "the kernel log's size",
    ask: '`{program}` asks the kernel how big its log buffer is.',
    work: "The kernel looks up the size of its log buffer, where printk's messages are kept.",
    meaning: 'its size, in bytes',
    refused: { EPERM: 'this needs root here: the kernel restricts its log' },
    predict: null,
  },
  'syslog-read': {
    request: "read the kernel's log",
    ask: '`{program}` asks the kernel for a copy of its log, up to {len} bytes.',
    work: "The kernel copies the messages in its log buffer, oldest first, into `{program}`'s buffer, and leaves the log as it was.",
    meaning: '{ret} {retUnit} of log',
    refused: { EPERM: 'this needs root here: the kernel restricts its log' },
    predict: null,
  },
  syslog: {
    request: "work on the kernel's log",
    ask: '`{program}` asks the kernel to work on its log: action {type}.',
    work: 'The kernel works on its log buffer, as action {type} asks.',
    meaning: 'it worked',
    refused: { EPERM: 'this needs root here: the kernel restricts its log' },
    predict: null,
  },
  readlink: {
    request: 'where this link points',
    ask: '`{program}` asks the kernel where the symbolic link {path} points.',
    work: "The VFS copies the link's target, a path, into `{program}`'s buffer, up to {bufsiz} bytes, without following it.",
    meaning: 'a {ret}-byte path',
    refused: {
      EINVAL: "{path} isn't a symbolic link",
      EACCES: "you aren't allowed to read where {path} points",
    },
    predict: COUNT,
  },
}

/** Each syscall by the CALL_SAY entry it shares, where its name differs. */
export const SAY_OF_SYSCALL: Readonly<Record<string, string>> = {
  openat: 'open',
  fstatat64: 'statx',
  stat64: 'statx',
  lstat64: 'statx',
  fstat: 'statx-fd',
  fstat64: 'statx-fd',
  pipe2: 'pipe',
  dup3: 'dup2',
  mkdirat: 'mkdir',
  unlinkat: 'unlink',
  renameat: 'rename',
  renameat2: 'rename',
  fchmodat: 'chmod',
  fchmodat2: 'chmod',
  readlinkat: 'readlink',
  clock_nanosleep: 'nanosleep',
  clock_nanosleep_time64: 'nanosleep',
  vfork: 'clone-vfork',
}

/** The file a call's route names, as it reads after "The file is …", by FsType. */
export const FS_SAY: Readonly<Record<string, string>> = {
  '9p': "on 9p, the Machine's root filesystem: its files live outside the VM and come in over virtio",
  ext4: "on ext4, the filesystem on the Machine's IDE disk",
  proc: 'on procfs, whose files the kernel writes out from its own state as you read them',
  sysfs: "on sysfs, where each file is one attribute of a device or driver, written out by the kernel when it's read",
  devtmpfs: 'on devtmpfs, where the kernel keeps the device files of /dev',
  devpts: 'on devpts, which holds the terminals under /dev/pts',
  tmpfs: 'on tmpfs, which keeps its files in memory',
  tracefs: "on tracefs, the kernel's tracing controls and output",
  pipefs: 'a pipe: its bytes wait in a buffer inside the kernel until a reader takes them',
  sockfs: 'a socket, so the networking code takes it from there',
  anon_inodefs: 'an anonymous kernel object, like an eventfd or an epoll, with no name in any folder',
}

/** What ext4 does with the bytes, past the VFS, as Linux 6.18 does it for a buffered call. */
export const EXT4_SAY: Readonly<Record<string, string>> = {
  read: "ext4 serves the bytes from the page cache, the kernel's copy of the disk in memory; on a miss, it reads the disk first.",
  write: 'ext4 puts the bytes in the page cache; the disk gets them later, at writeback.',
}

/** The device a call's driver route names, as it reads after "The file is …", by driver. */
export const DRIVER_SAY: Readonly<Record<string, string>> = {
  tty: 'a terminal, so the tty driver does the work',
  mem: 'a memory device, so the mem driver does the work',
  random: "/dev/random or /dev/urandom, so the random driver hands out bytes from the kernel's random number generator",
}

/** A device whose driver X-ray has no words for yet. */
export const DRIVER_FALLBACK = 'a device, so its driver, {driver}, does the work'

// models drivers/char/mem.c: read_null(), write_null()
export const NULL_SAY: Readonly<Record<string, string>> = {
  read: 'It is /dev/null, which has nothing to give: the read gets end of file at once.',
  write: 'It is /dev/null, which throws the bytes away and reports them all written.',
}

/** The kernel beat's route sentences. */
export const ROUTE = {
  file: 'The file is {on}.',
  folder: 'The folder is {on}.',
  source: 'The file it reads from is {on}.',
} as const

/** The clone flags that change what the new task shares (include/uapi/linux/sched.h). */
export const CLONE_VM = 0x100
export const CLONE_VFORK = 0x4000
export const CLONE_THREAD = 0x10000

/** fcntl.h's open flags as i386 numbers them (include/uapi/asm-generic/fcntl.h). */
export const O_ACCMODE = 0o3
export const O_CREAT = 0o100
export const O_DIRECTORY = 0o200000
export const ACCESS = ['for reading', 'for writing', 'for reading and writing'] as const

/** statx's and fstatat's flag for "the fd itself, no path" (include/uapi/linux/fcntl.h). */
export const AT_EMPTY_PATH = 0x1000
/** unlinkat's flag that makes it rmdir. */
export const AT_REMOVEDIR = 0x200

/** wait4's options (include/uapi/linux/wait.h). */
export const WNOHANG = 1
export const WUNTRACED = 2

/** syslog's actions (include/linux/syslog.h). */
export const SYSLOG_ACTION_READ_ALL = 3
export const SYSLOG_ACTION_SIZE_BUFFER = 10
