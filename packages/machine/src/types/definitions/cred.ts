import type { Cred } from '#types/definitions/task'

// models kernel/cred.c: init_cred, root with no supplementary groups
export const INIT_CRED: Cred = { uid: 0, gid: 0, groups: [] }

// models Alpine's /etc/group (the minirootfs): the system groups that own terminals, disks and memory
export const TTY_GID = 5
export const DISK_GID = 6
/** Owns /dev/mem, so tools that read kernel memory need neither root nor its write access. */
export const KMEM_GID = 9
/** Owns /etc/shadow, so programs like passwd can read it without being root. */
export const SHADOW_GID = 42

/** The player's account, "you" in /etc/passwd: the first regular user, as on most distributions. */
export const PLAYER_CRED: Cred = { uid: 1000, gid: 1000, groups: [1000] }

export const PLAYER_NAME = 'you'
export const PLAYER_HOME = '/home/you'
