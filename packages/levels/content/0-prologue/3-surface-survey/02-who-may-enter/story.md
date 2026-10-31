# Who May Enter

## Scene

> **init:** Try the house at `/etc/shadow`.

```
$ cat /etc/shadow
cat: /etc/shadow: Permission denied
```

> **init:** "Permission denied." Good. That door should stay shut to you.
>
> **init:** The Kernel knows every user by a number, a _user ID_. Yours is 1000. Every file has an owner and nine little switches: read, write, execute, for the owner, the owner's group, and everyone else.
>
> **The Watchdog:** And the Kernel checks them on every open. No exceptions. Except one.
>
> **init:** User ID 0. _root_, the administrator. The Kernel lets root past almost every check. I run as root; I'm PID 1, someone has to. You'll need it too, one day. Not today.

## See it

> **init:** Who are you, to the Kernel? `id` asks.

```
$ id
uid=1000(you) gid=1000(you) groups=1000(you)
$ ls -l /etc/shadow
-rw-r----- 1 root shadow 78 Jan  1 00:00 /etc/shadow
```

> **init:** Read the `ls -l` line left to right. `-` is a plain file (`d` would be a folder, `c` a character device). Then three groups of three letters: `rw-` for the owner, `r--` for the group, `---` for everyone else. A letter is on, a `-` is off. Then the number of names, the owner `root`, the group `shadow`, the size, the date and the name.

X-ray's Gate view, zoomed into the failing call:

```
openat(AT_FDCWD, "/etc/shadow", O_RDONLY) = -1 EACCES (Permission denied)
```

> **init:** Inside the Gate, the Kernel walks the path to the file, then `may_open()` → `inode_permission()` → `generic_permission()` compares your process with the file. uid 1000 isn't the owner, 0. Your group `you` isn't `shadow`. So the "other" bits apply: `---`. The Kernel answers with the error `EACCES`, "permission denied", and `cat` prints it.
>
> **init:** Now me, the same `openat`, as root. It works, by the same rule: root owns `/etc/shadow`, so the owner bits `rw-` apply. (I close it without showing you. Not mine to share.) Root's real way past a lock, a _capability_, you'll see in a moment, on a file root doesn't own.

```
$ ls -l /dev/null /dev/vda
crw-rw-rw- 1 root root   1, 3 Jan  1 00:00 /dev/null
brw-rw---- 1 root disk 254, 0 Jan  1 00:00 /dev/vda
```

> **init:** Doors in `/dev` have locks too. Anyone may write into `/dev/null`. The disk, `/dev/vda`, opens only for root and the `disk` group: otherwise anyone could read every file on it, locks or not. Down in the Deep, you'll build a door of your own.

## Build it

> **init:** Your turn to read locks. For each line: may you read it? May you change it? Answer before the next line lights.

```
$ ls -l notes.txt /etc/passwd /etc/shadow
-rw-r--r-- 1 root root   112 Jan  1 00:00 /etc/passwd
-rw-r----- 1 root shadow  78 Jan  1 00:00 /etc/shadow
-rw-r--r-- 1 you  you     57 Jan  1 00:00 notes.txt
```

> **init:** `/bin/ls` starts `-rwxr-xr-x` and belongs to root: anyone may read it and run it, only root may change it.
>
> **init:** `chmod` changes the switches. With numbers, add r=4, w=2, x=1 for each of owner, group and other: `644` is `rw-r--r--`, `600` is `rw-------`, `755` is `rwxr-xr-x`. With letters, `u+x` gives the owner (u) execute, `go-r` takes read from group (g) and other (o), `-x` takes execute from everyone.

The execute bit. `hi` is your own copy of `/bin/echo`, the program; the `echo` you type is my shell's builtin, which runs no program at all:

```
$ cp /bin/echo hi
$ chmod -x hi
$ ./hi hello, Machine
rescue: ./hi: Permission denied
$ chmod u+x hi
$ ./hi hello, Machine
hello, Machine
$ ls -l hi
-rwxr--r-- 1 you you 73880 Jan  1 00:00 hi
```

> **init:** The Kernel refused to run it: `execve` returned `EACCES`. With `x` back for its owner, it runs. Group and others still have no `x`: `-x` took it from everyone, `u+x` gave it back to you alone.

A folder's `x`:

```
$ mkdir box
$ cp notes.txt box/
$ chmod 644 box
$ cat box/notes.txt
cat: box/notes.txt: Permission denied
$ chmod 755 box
$ cat box/notes.txt
Lamps to check: Userland, the Harbor, the Gate. Not yet.
```

> **init:** On a folder, `x` means "may pass through". Without it, nothing inside can be reached, even a file you may read.
>
> **init:** Now your errand. Look at `ls -l notes.txt`: who may read it? Then watch the neighbour, `guest`, uid 1001, try. I'll knock for them: `runuser -u guest -- cat /home/you/notes.txt`. (Only root may run a command as someone else.)

```
# runuser -u guest -- cat /home/you/notes.txt
Lamps to check: Userland, the Harbor, the Gate. Not yet.
```

> **init:** Anyone may read it: the "other" bits are `r--`. Make the note yours alone, then I'll knock again. And try one more: `chmod 666 /etc/motd`.

## Watch it

> **init:** With `notes.txt` at `-rw-------`, who can read it: you (uid 1000), the neighbour (uid 1001), me (uid 0)? Then all three try.

```
$ chmod 600 notes.txt
$ ls -l notes.txt
-rw------- 1 you you 57 Jan  1 00:00 notes.txt
$ chmod 666 /etc/motd
chmod: changing permissions of '/etc/motd': Operation not permitted
```

> **init:** You: the owner bits, `rw-`, so yes. The neighbour: the "other" bits, `---`, so `EACCES`. Me: not the owner either, so the "other" bits fail for me too. Then `generic_permission()` checks one more thing: a _capability_, a single named privilege. Root holds `CAP_DAC_READ_SEARCH`, which lets it read anything. (`CAP_DAC_OVERRIDE` would cover a write.)
>
> **init:** And `/etc/motd` is mine. Only a file's owner, or root, may change its mode. That "no" is `EPERM`, "operation not permitted": a different "no" from `EACCES`. One is "the lock says no", the other "that's not yours to change".
>
> **The Watchdog:** Padlocks on every door. Finally, some order.

## Debrief

> **init:** Owner, group, everyone else. Read, write, execute. And root, who walks past most locks.
>
> **init:** Locks stop _who_ can touch a file. Next, the ones doing the touching: processes. You can watch them, pause them, and stop them, as long as they're yours.

## Real world

The same locks on any Linux machine. `sudo -u nobody` runs one command as the user `nobody`, the way `runuser` did for the neighbour:

```sh
id
ls -l /etc/passwd /etc/shadow
cat /etc/shadow                          # Permission denied
strace -e trace=openat cat /etc/shadow   # = -1 EACCES
cd /tmp && echo secret > note.txt && chmod 600 note.txt && ls -l note.txt
sudo -u nobody cat /tmp/note.txt         # Permission denied: "other" has no r
```
