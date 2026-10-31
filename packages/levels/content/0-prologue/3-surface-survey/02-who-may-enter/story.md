# Who May Enter

## Scene

> **init:** Try the house at `/etc/shadow`.

```
$ cat /etc/shadow
cat: can't open '/etc/shadow': Permission denied
```

> **init:** "Permission denied." Good. That door should stay shut to you.
>
> **init:** The kernel knows every user by a number, a _user ID_. Yours is 1000. Every file has an owner, a group, and nine little switches: read, write, execute, for the owner, for the file's group, and for everyone else.
>
> **The Watchdog:** And the kernel checks them on every open. No exceptions. Except one.
>
> **init:** User ID 0. _root_, the administrator. The kernel lets root past almost every check. I run as root; I'm PID 1, someone has to. You'll need it too, one day. Not today.

## See it

> **init:** Who are you, to the kernel? `id` asks. A _group_ is a named set of users that can share files; yours, `you`, holds only you.

```
$ id
uid=1000(you) gid=1000(you) groups=1000(you)
$ ls -l /etc/shadow
-rw-r-----    1 root     shadow         285 Oct 31 16:31 /etc/shadow
```

> **init:** Read the `ls -l` line left to right. `-` is a plain file (`d` would be a folder, `l` a link, `c` or `b` a device). Then three groups of three letters: `rw-` for the owner, `r--` for the group, `---` for everyone else. A letter is on, a `-` is off. Then the number of names the file has, the owner `root`, the group `shadow`, the size in bytes, the date it last changed and the name.

X-ray's Gate view, zoomed into the failing call:

```
open("/etc/shadow", O_RDONLY|O_LARGEFILE) = -1 EACCES (Permission denied)
```

> **init:** Inside the Gate, the kernel walks the path to the file, then `may_open()` → `inode_permission()` → `generic_permission()` compares your process with the file. uid 1000 isn't the owner, 0. You aren't in the group `shadow`. So the "other" bits apply: `---`. The kernel answers with the error `EACCES`, "permission denied", and `cat` prints it.
>
> **init:** When I open it, as root, it works by the same rule: root owns `/etc/shadow`, so the owner bits `rw-` apply. (I close it without showing you. Not mine to share.) Root's real way past a lock, a _capability_, you'll see in a moment, on a file root doesn't own.

```
$ ls -l /dev/null /dev/sda
crw-rw-rw-    1 root     root        1,   3 Oct 31 16:30 /dev/null
brw-------    1 root     root        8,   0 Oct 31 16:30 /dev/sda
```

> **init:** Doors in `/dev` have locks too. Anyone may write into `/dev/null`. The disk, `/dev/sda`, opens only for its owner, root: otherwise anyone could read every byte on it, locks or not. Down in the Deep, you'll build a door of your own.

## Build it

> **init:** Your turn to read locks. For each line: may you read it? May you change it? Answer before the next line lights.

```
$ ls -l notes.txt /etc/passwd /etc/shadow
-rw-r--r--    1 root     root           735 Oct 31 16:31 /etc/passwd
-rw-r-----    1 root     shadow         285 Oct 31 16:31 /etc/shadow
-rw-r--r--    1 you      you             57 Oct 31 16:31 notes.txt
```

> **init:** `/etc/passwd`: anyone may read it, only root may change it. `/etc/shadow`: not yours to read or change. `notes.txt` is yours: you may read and change it, and so far everyone else may read it.
>
> **init:** `chmod` changes the switches. With numbers, add r=4, w=2, x=1 for each of owner, group and other: `644` is `rw-r--r--`, `600` is `rw-------`, `755` is `rwxr-xr-x`. With letters, `u+x` gives the owner (u) execute, `go-r` takes read from group (g) and other (o), `-x` takes execute from everyone.

The execute bit. `/usr/local/bin/say` is a small program I built tonight: it prints its words, like `echo`. Unlike `echo`, it's a program file of its own, so you can copy it and take its `x` away:

```
$ cp /usr/local/bin/say hi
$ ls -l hi
-rwxr-xr-x    1 you      you          17208 Oct 31 16:31 hi
$ chmod -x hi
$ ./hi hello, Machine
-bash: ./hi: Permission denied
$ chmod u+x hi
$ ./hi hello, Machine
hello, Machine
$ ls -l hi
-rwxr--r--    1 you      you          17208 Oct 31 16:31 hi
```

> **init:** Bash forked a child to run `hi`, and the kernel refused the child's `execve` with `EACCES`. The child printed why and exited with status 126, "found, but couldn't run". With `x` back for its owner, it runs. Group and others still have no `x`: `-x` took it from everyone, `u+x` gave it back to you alone.

A folder's `x`:

```
$ mkdir box
$ cp notes.txt box/
$ chmod 644 box
$ cat box/notes.txt
cat: can't open 'box/notes.txt': Permission denied
$ chmod 755 box
$ cat box/notes.txt
Lamps to check: Userland, the Harbor, the Gate. Not yet.
```

> **init:** On a folder, `x` means "may pass through". Without it, nothing inside can be reached, even a file you may read.
>
> **init:** Now your errand. Look at `ls -l notes.txt`: who may read it? Watch the neighbour, `guest`, uid 1001, try. I knock for them, as root: `runuser -u guest -- cat /home/you/notes.txt` runs `cat` as `guest`. (Only root may use `runuser`. Anyone else who wants to become another user needs `su` and that user's password.)

```
# runuser -u guest -- cat /home/you/notes.txt
Lamps to check: Userland, the Harbor, the Gate. Not yet.
```

> **init:** Anyone may read it: the "other" bits are `r--`. Make the note yours alone, then I'll knock again. And try one more: `chmod 666 /etc/motd`.

## Watch it

> **init:** With `notes.txt` at `-rw-------`, who can read it: you (uid 1000), the neighbour (uid 1001), me (uid 0)? You and the neighbour try first; then I'll tell you how my own try went.

```
$ chmod 600 notes.txt
$ ls -l notes.txt
-rw-------    1 you      you             57 Oct 31 16:31 notes.txt
$ cat notes.txt
Lamps to check: Userland, the Harbor, the Gate. Not yet.
# runuser -u guest -- cat /home/you/notes.txt
cat: can't open '/home/you/notes.txt': Permission denied
$ chmod 666 /etc/motd
chmod: /etc/motd: Operation not permitted
```

> **init:** You: the owner bits, `rw-`, so yes. The neighbour: the "other" bits, `---`, so `EACCES`. Me: not the owner either, so the "other" bits fail for me too. Then `generic_permission()` checks one more thing: a _capability_, a single named privilege. Root holds `CAP_DAC_READ_SEARCH`, which lets it read anything. (`CAP_DAC_OVERRIDE` would cover a write.)
>
> **init:** And `/etc/motd` is mine. Only a file's owner, or root, may change its mode. That "no" is `EPERM`, "operation not permitted": a different "no" from `EACCES`. One is "the lock says no", the other "that's not yours to change".
>
> **init:** Locked yourself out with `chmod 000`? Then even `cat notes.txt` is refused. You still own the file, so `chmod 600 notes.txt` gives the key back.
>
> **The Watchdog:** Padlocks on every door. Finally, some order.

## Debrief

> **init:** Owner, group, everyone else. Read, write, execute. And root, who walks past most locks.
>
> **init:** Locks decide _who_ may touch a file. Next, in Processes from Outside, the ones doing the touching: processes. You can watch them, pause them, and stop them, as long as they're yours.

## Real world

The same locks on any Linux machine. `sudo -u nobody` runs one command as the user `nobody`, the way `runuser` did for the neighbour:

```sh
id
ls -l /etc/passwd /etc/shadow
cat /etc/shadow                                 # Permission denied
strace -e trace=open,openat cat /etc/shadow     # = -1 EACCES
cd /tmp && echo secret > note.txt && chmod 600 note.txt && ls -l note.txt
sudo -u nobody cat /tmp/note.txt                # Permission denied: "other" has no r
```

GNU `cat` says it differently: `cat: /etc/shadow: Permission denied`. The kernel's answer, `EACCES`, is the same.
