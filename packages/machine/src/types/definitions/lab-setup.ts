import type { Validated } from '@kernelfall/core/types'
import type { LabBootSetup } from '#types/definitions/boot'
import type { Cred } from '#types/definitions/task'

/** An account in /etc/passwd. */
export interface LabUser {
  readonly name: string
  readonly uid: number
  /** The primary group. Left out, the user gets a group of its own with gid = uid, as useradd does. */
  readonly gid?: number
  /** Left out: /root for uid 0, /home/<name> for everyone else. */
  readonly home?: string
  /** Left out: /bin/sh. */
  readonly shell?: string
}

/** A group in /etc/group. */
export interface LabGroup {
  readonly name: string
  readonly gid: number
  /** User names whose supplementary groups include this one. */
  readonly members?: readonly string[]
}

export const LAB_PATH_KINDS = ['file', 'dir'] as const
export type LabPathKind = (typeof LAB_PATH_KINDS)[number]

/** A file or directory a level puts on the Machine before the player arrives. */
export interface LabPath {
  /** Absolute path; missing parent directories are created, owned by root. */
  readonly path: string
  /** Left out: a file. */
  readonly kind?: LabPathKind
  /** Permission bits (with setuid, setgid and sticky). Left out: 0644 for a file, 0755 for a directory. */
  readonly mode?: number
  /** The owning user's name. Left out: root. */
  readonly owner?: string
  /** The owning group's name. Left out: the owner's primary group. */
  readonly group?: string
  /** A file's contents, as UTF-8 text. Left out: empty. */
  readonly content?: string
}

/** A program already running when the player arrives, started by the setup as root's (S.3's `sleep 600`). */
export interface LabProcess {
  /** argv[0] is searched in PATH, as a shell does, unless it has a slash. */
  readonly argv: readonly string[]
  /** The pid it gets, so the story can name it. Left out: the next free one. */
  readonly pid?: number
  /** Who it runs as, by name. Left out: the player. */
  readonly user?: string
  /** A file its stdout goes to instead of the console, e.g. /dev/null. */
  readonly stdout?: string
}

/** A LabProcess with its account resolved: what the setup needs to start it. */
export interface ResolvedLabProcess {
  readonly argv: readonly string[]
  readonly pid?: number
  readonly cred: Cred
  /** The user's login environment. */
  readonly env: readonly string[]
  readonly stdout?: string
}

/**
 * A level.yaml `lab:` block; empty is the shared Machine (root and `you`, `/home/you`). No CPU
 * count: v86 emulates one CPU, so every level runs on one (`useMachineCpus()` reads it).
 */
export interface LabSetup {
  /** Accounts besides root and `you`. */
  readonly users?: readonly LabUser[]
  /** Groups besides root's and `you`'s. */
  readonly groups?: readonly LabGroup[]
  /** Files and directories, created in order (so a directory can come before what goes in it). */
  readonly files?: readonly LabPath[]
  /** The user name the player logs in as. Left out: `you`. */
  readonly player?: string
  /** Where the player's shell starts. Left out: the player's home directory. */
  readonly cwd?: string
  /** Environment variables added to (or replacing) the login defaults PATH and HOME. */
  readonly env?: Readonly<Record<string, string>>
  /**
   * Programs gcc builds at setup, by name, into /usr/local/bin/<name> from /usr/local/src/<name>.c:
   * a source the app passes to `useMachineSetup()`, or one `files` puts there.
   */
  readonly bin?: readonly string[]
  /** Programs running before the player's first command, started in order (see `resolveLabProcesses()`). */
  readonly processes?: readonly LabProcess[]
  /**
   * GRUB's entry; with it, the setup restarts the Machine, so nothing in tmpfs (/run, /tmp) or
   * running survives it.
   */
  readonly boot?: LabBootSetup
}

export interface ResolvedUser {
  readonly name: string
  readonly uid: number
  readonly gid: number
  readonly home: string
  readonly shell: string
}

export interface ResolvedGroup {
  readonly name: string
  readonly gid: number
  readonly members: readonly string[]
}

/** In file order. */
export interface Accounts {
  readonly users: readonly ResolvedUser[]
  readonly groups: readonly ResolvedGroup[]
}

export type LabSetupValidation = Validated<LabSetup>
