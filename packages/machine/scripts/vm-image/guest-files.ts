import {
  VM_CONTROL_DONE,
  VM_MARKER_FD,
  VM_PLAYER,
  VM_PLAYER_FILE,
  VM_SESSION_FILE,
  VM_SHELL_PID_FILE,
  VM_TRACE_END,
  VM_TRACE_START,
} from '#types/definitions/vm'
import { VM_TRACE_GROUP } from '#types/definitions/vm-trace'
import type { ArchiveEntry } from '#vm-image/archive'
import { TRACE_PROBE_LIST } from '#vm-image/trace-probes'

const TRACING = '/sys/kernel/tracing'

// Started at boot, outside the shell, so the reader never traces itself; kf-shell turns tracing on.
// A probe whose function this kernel lacks is skipped; the rest still load.
export const TRACE = `#!/bin/sh
T=${TRACING}
echo 0 > $T/tracing_on
echo 4096 > $T/buffer_size_kb
while IFS='|' read -r name definition filter; do
  echo "$definition" >> $T/dynamic_events 2>/dev/null || continue
  [ -n "$filter" ] && echo "$filter" > $T/events/${VM_TRACE_GROUP}/$name/filter
done <<'PROBES'
${TRACE_PROBE_LIST.map((probe) => `${probe.name}|${probe.definition}|${probe.filter ?? ''}`).join('\n')}
PROBES
echo 1 > $T/events/syscalls/enable
echo 1 > $T/events/${VM_TRACE_GROUP}/enable
for e in sched_process_fork sched_process_exec sched_process_exit sched_process_free; do
  echo 1 > $T/events/sched/$e/enable
done
echo 1 > $T/events/signal/enable
echo 1 > $T/events/exceptions/page_fault_user/enable 2>/dev/null
stty -F /dev/ttyS1 raw -echo
setsid cat $T/trace_pipe > /dev/ttyS1 &
`

// Markers split the events into command lines; \${ …; } runs without forking, so they add no process.
// The line goes in the start marker: looking it up before the command keeps that work out of it.
// A level's session (its cwd, its exports) comes last, so it wins over the login defaults.
export const PROFILE = `if [ -n "$BASH_VERSION" ] && { : >&${VM_MARKER_FD}; } 2>/dev/null; then
  PS0='\${ echo "${VM_TRACE_START} \${ HISTTIMEFORMAT= history 1; }" >&${VM_MARKER_FD}; }'
  PROMPT_COMMAND='echo "${VM_TRACE_END} $?" >&${VM_MARKER_FD}'
fi
[ -r ${VM_SESSION_FILE} ] && . ${VM_SESSION_FILE}
`

// The host's root channel for a level's setup: a command line in, its status out. init starts it,
// so it is no descendant of the player's shell and never traced.
export const CONTROL = `#!/bin/sh
stty -F /dev/ttyS2 raw -echo
exec </dev/ttyS2 >/dev/ttyS2 2>&1
while IFS= read -r line; do
  eval "$line"
  echo "${VM_CONTROL_DONE} $?"
done
`

/** The player in /etc/passwd, /etc/group and /etc/shadow (no password: only root's su starts it). */
export const PLAYER_PASSWD = `${VM_PLAYER.name}:x:${VM_PLAYER.uid}:${VM_PLAYER.gid}:${VM_PLAYER.name}:${VM_PLAYER.home}:/bin/bash\n`
export const PLAYER_GROUP = `${VM_PLAYER.name}:x:${VM_PLAYER.gid}:\n`
export const PLAYER_SHADOW = `${VM_PLAYER.name}:!::0:::::\n`

// init's message to the city, as P.1's story has it; os-release stays Alpine's, which is true.
export const MOTD = `Welcome to the Machine.
The kernel panicked tonight, and every process froze.
Find the way down, and bring the kernel back.
`

// The guest boots busybox init, which starts a login-free bash on the serial console.
export const INITTAB = `::sysinit:/etc/kf-rc
ttyS0::respawn:/sbin/getty -n -l /usr/libexec/kf-shell 115200 ttyS0 vt100
ttyS2::respawn:/usr/sbin/kf-control
::ctrlaltdel:/sbin/reboot
::shutdown:/bin/umount -a -r
`

export const RC = `#!/bin/sh
mount -t proc proc /proc 2>/dev/null
mount -t sysfs sys /sys 2>/dev/null
mkdir -p /dev/pts /dev/shm
mount -t devpts devpts /dev/pts
mount -t tmpfs tmpfs /tmp
mount -t tmpfs tmpfs /run
mount -t tracefs tracefs ${TRACING} 2>/dev/null
hostname kernelfall
# No hotplug helper loads drivers for new devices: the data disk's sd driver is loaded here, and
# ext4, as busybox mount only tries the filesystems the kernel already has.
modprobe -q sd_mod
modprobe -q ext4
modprobe -q virtio_net
# linux-virt sets CONFIG_SECURITY_DMESG_RESTRICT; the levels read the kernel's log as the player.
echo 0 > /proc/sys/kernel/dmesg_restrict
/usr/sbin/kf-trace
`

// Only this shell and what it starts are traced: the pid it keeps through su's exec, and its
// children. Root opens trace_marker for it, then it becomes the player.
export const SHELL = `#!/bin/sh
echo $$ > ${TRACING}/set_event_pid
echo 1 > ${TRACING}/options/event-fork
echo 1 > ${TRACING}/tracing_on
echo $$ > ${VM_SHELL_PID_FILE}
exec ${VM_MARKER_FD}>${TRACING}/trace_marker
export TERM=xterm-256color
exec su -l "$(cat ${VM_PLAYER_FILE} 2>/dev/null || echo ${VM_PLAYER.name})"
`

// The 9p root is v86's "host9p" share; its modules come from this initramfs. cache=mmap, not
// loose: loose keeps a file's old pages, so an edit the editor writes would never reach gcc.
export const INIT = `#!/bin/busybox sh
/bin/busybox --install -s /bin
mount -t proc proc /proc
mount -t sysfs sys /sys
mount -t devtmpfs dev /dev
for m in netfs 9pnet 9pnet_virtio 9p; do insmod /lib/$m.ko; done
mkdir -p /newroot
mount -t 9p -o trans=virtio,version=9p2000.L,cache=mmap,msize=512000 host9p /newroot || exec sh
mount --move /dev /newroot/dev
umount /proc /sys
exec switch_root /newroot /sbin/init
`

export function guestFile(path: string, content: string, mode = 0o644): ArchiveEntry {
  return { path, kind: 'file', mode, uid: 0, gid: 0, mtime: 0, link: '', data: new TextEncoder().encode(content) }
}

export function guestDir(path: string, uid: number, gid: number, mode = 0o755): ArchiveEntry {
  return { path, kind: 'dir', mode, uid, gid, mtime: 0, link: '', data: new Uint8Array() }
}
