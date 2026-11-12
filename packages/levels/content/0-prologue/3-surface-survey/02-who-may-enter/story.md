# Who May Enter

**Question:** Who decides whether you may open a file, and by what rule?

## Scene

> **init:** In The Streets of Userland, a line began `-r--r--r--`. That is a file's lock. Every file has one, and the kernel reads it before it opens the file for anyone. Try a locked file: `cat /etc/shadow`.

---

```
$ cat /etc/shadow
cat: can't open '/etc/shadow': Permission denied
```

> **init:** Good. That file holds the passwords, scrambled, and it should stay shut to you.
>
> **The Watchdog:** The kernel checked. It checks every open.

## See it

> **init:** The kernel knows each user by a number, a _user ID_, and every process runs as one user. `id` prints yours.

---

```
$ id
uid=1000(you) gid=1000(you) groups=1000(you)
```

> **init:** You are user 1000. A _group_ is a named set of users; yours, `you`, holds only you. Now read the lock: `ls -l /etc/shadow`.

---

```
$ ls -l /etc/shadow
-rw-r-----    1 root     shadow         274 Jan  1  1970 /etc/shadow
```

> **init:** The first character is the kind: `-` for a plain file, `d` for a folder. After it come nine letters, the file's _permissions_: three for its owner, three for its group, three for everyone else. `r` is read, `w` is write, `x` is execute, and `-` is no. Further along the line, the owner is `root` and the group is `shadow`. The kernel keeps all of it in the file's inode.
>
> **init:** The kernel uses one of the three. You aren't the owner, and you aren't in the group, so yours are the last three: `---`. X-ray shows the answer `cat` got, the error `EACCES`:

```
open("/etc/shadow", O_RDONLY|O_LARGEFILE) = -1 EACCES (Permission denied)
```

## Build it

> **init:** `chmod` changes the permissions of a file you own. I left a small program at `/usr/local/bin/say`. Copy it, take the copy's `x` away, run it, give the `x` back, and run it again.

---

```
$ cp /usr/local/bin/say hi
$ chmod -x hi
$ ./hi hello, Machine
-bash: ./hi: Permission denied
$ chmod u+x hi
$ ./hi hello, Machine
hello, Machine
```

> **init:** Without `x`, the kernel refused to run it, with the same `EACCES`. `u+x` gave `x` back to the owner alone: `u` is the owner, `g` the group, `o` the others.
>
> **init:** On a folder, `x` means "may pass through". `chmod` takes numbers too: `r` is 4, `w` is 2, `x` is 1, added up for owner, group and others. So `644` is `rw-r--r--`, a folder nobody may pass through. Try it on a folder with your note inside.

---

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

> **init:** Your errand. `notes.txt` is `-rw-r--r--`: anyone may read it. Make it yours alone, and check with `ls -l notes.txt`. Then try `chmod 666 /etc/motd`, a file of mine.
>
> **init:** Locked out? You still own it: `chmod` gives the key back.

## Watch it

> **init:** Your note is `-rw-------` now. Three of us try to read it: you, the neighbour `guest`, who is user 1001, and me, user 0. Who gets in? Then read it yourself: `cat notes.txt`.
>
> - only you
> - [x] you and me, but not the neighbour
> - all three of us

---

```
$ cat notes.txt
Lamps to check: Userland, the Harbor, the Gate. Not yet.
```

> **init:** I ran `cat` as `guest`:

```
cat: can't open '/home/you/notes.txt': Permission denied
```

> **init:** You own the note: `rw-`. The neighbour gets the last three, `---`, and `EACCES`. I'm not the owner either, yet I can read it. User 0 is _root_, the administrator, and root holds _capabilities_: named privileges that let it past a check. One of them lets root read any file.
>
> **init:** And your `chmod 666 /etc/motd`:

```
chmod: /etc/motd: Operation not permitted
```

> **init:** A different error, `EPERM`. Only a file's owner, or root, may change its permissions.

## Debrief

> **init:** So the kernel decides, on every open: owner, group or everyone else, then that one's three letters. Locks say who may touch a file. In Processes from Outside, you meet the ones doing the touching.
>
> **The Watchdog:** Padlocks on every file. Finally, some order.

## Real world

The same locks on any Linux machine. `sudo -u nobody` runs one command as the user `nobody`, the way init ran `cat` as the neighbour:

```sh
id
ls -l /etc/passwd /etc/shadow
cat /etc/shadow                                 # Permission denied
strace -e trace=open,openat cat /etc/shadow     # = -1 EACCES
cd /tmp && echo secret > note.txt && chmod 600 note.txt && ls -l note.txt
sudo -u nobody cat /tmp/note.txt                # Permission denied: the others have no r
```

GNU `cat` says it differently: `cat: /etc/shadow: Permission denied`. The kernel's answer, `EACCES`, is the same.
