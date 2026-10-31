import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Relative to the package; written by `pnpm vm:facts`. */
export const MACHINE_FACTS_FILE = 'src/test/machine-facts.json'

/** What levels quote about the Machine, typed as the player (uid 1000) on a clean boot. */
export const FACT_COMMANDS = [
  'uname -a',
  'cat /etc/os-release',
  'id',
  'echo "$PATH"',
  'echo "$SHELL $BASH_VERSION"',
  'cat /proc/cmdline',
  'nproc',
  'grep -E "^(processor|vendor_id|model name|flags)" /proc/cpuinfo',
  'head -5 /proc/meminfo',
  'free',
  'cat /proc/interrupts',
  'cat /proc/mounts',
  'ls /',
  'ls -la /',
  'ls /dev',
  'ls -l /dev/sda /dev/sda1 /dev/tty /dev/ttyS0 /dev/null',
  'ls /boot',
  'lsblk',
  'lspci -nnk',
  'ip link',
  'ls /sys/class/net',
  'cat /sys/class/net/eth0/operstate',
  'readlink /sys/class/net/eth0/device/driver',
  'lsmod',
  'ls -l /bin/ls /bin/cat /bin/sh /bin/bash',
  'ps',
  'ps -o pid,ppid,user,stat,comm',
  'cat /proc/$$/status',
  'cat /proc/self/maps',
  'cat /proc/uptime',
  'dmesg | head -5',
  'cat /etc/shadow',
  'chmod 600 /etc/motd',
  'rmdir /etc',
  'find /root',
  'nosuchcommand; echo "status $?"',
  'cat /etc/motd',
  'ls -l /etc/passwd /etc/shadow /etc/motd',
  'cat /etc/passwd',
  'cat /etc/group',
  'ls /home',
  'gcc --version | head -1',
  'which man lspci lscpu lsblk dtc runuser setpriv strace tcc file tree',
  'man -w ls',
  'grub-install --version',
]

export interface MachineFacts {
  /** The image they were typed on: re-run `pnpm vm:facts` when it changes. */
  readonly image: string
  readonly outputs: Readonly<Record<string, string>>
}

export function machineFacts(): MachineFacts {
  const pkg = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
  return JSON.parse(readFileSync(join(pkg, MACHINE_FACTS_FILE), 'utf8')) as MachineFacts
}
