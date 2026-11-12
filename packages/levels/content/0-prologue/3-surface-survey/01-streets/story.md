# The Streets of Userland

**Question:** What is a folder, and what really moves when you move a file?

## Scene

> **init:** You brought the Machine up and saw it from my doorstep. Now walk it. Userland is one tree of folders, the file tree from Power On, and every program stands somewhere in it.
>
> **The Watchdog:** And every step you take asks the kernel. Same as before.
>
> **init:** Today you build a little too: make folders, copy, rename, clean up.

## See it

> **init:** Where are you standing? Every process has a _working directory_: the folder its paths start from. Type `pwd`.

---

```
$ pwd
/home/you
```

> **init:** A path that starts with `/` is _absolute_: walked from the root. Any other path is _relative_: walked from the working directory, and `..` means one folder up. `cd` moves you. Run `cd /etc`, `pwd`, `cd ..`, and `pwd` again.

---

```
$ cd /etc
$ pwd
/etc
$ cd ..
$ pwd
/
```

> **init:** Look at `cd /etc` in X-ray: no program started. bash made the call itself, `chdir("/etc")`. `cd` is a _builtin_, like `echo` in Speak to the Shell: the shell does it itself. And `cd` has to be one. A working directory belongs to one process: a program started for the job would move itself, exit, and leave your shell where it was.
>
> **init:** Now a relative path. Run `cd home/you`, then `cat ../../etc/motd`: up to `/home`, up to `/`, down into `etc`.

---

> **init:** X-ray shows who did the walking. For `cd`, bash worked the path out itself and handed the kernel `chdir("/home/you")`. `cat` handed over `../../etc/motd` just as you typed it, and the kernel walked it from `cat`'s working directory. From another folder, the same relative path would name a different file, or none.

## Build it

> **init:** Your errand: a survey office in `/tmp`, where anyone may write. Make its folders. `-p` makes every missing folder on the way.

```
$ mkdir /tmp/survey
$ mkdir /tmp/survey/maps
$ mkdir -p /tmp/survey/notes/old
```

---

> **init:** Copy two files in, then ask for _inode_ numbers with `ls -i`. An inode is the kernel's record of one file: its size, its owner, and where its data is.

```
$ cp /etc/motd /tmp/survey/maps/motd
$ cp /etc/os-release /tmp/survey/maps/
$ ls -i /etc/motd /tmp/survey/maps/motd
    142 /etc/motd                    6 /tmp/survey/maps/motd
```

---

> **init:** Two numbers: a copy is a new file. Now rename the copy, and ask again.

```
$ cd /tmp/survey/maps
$ mv motd motd.old
$ ls -i motd.old
      6 motd.old
```

---

> **init:** The same number. The file didn't move: only its name changed. A folder is a list of names, each pointing at an inode.
>
> **init:** Move `motd.old` into `../notes/`, remove it there with `rm`, then try `rmdir ../notes`.

---

```
$ rmdir ../notes
rmdir: '../notes': Directory not empty
```

> **init:** `notes` still holds `old`, and `rmdir` removes only empty folders. Finish the errand: leave `/tmp/survey` holding `maps/os-release` and an empty `notes/`, stand in `/tmp/survey`, and check with `pwd` and `ls -R /tmp/survey`, which lists a folder and every folder inside it.

## Watch it

> **init:** `ls -l` prints a file's size. Before you run `ls -l /proc/uptime` and `cat /proc/uptime`: what size will it print?
>
> - [x] 0 bytes
> - as many bytes as `cat` prints

---

```
$ ls -l /proc/uptime
-r--r--r--    1 root     root             0 Nov 12 18:43 /proc/uptime
$ cat /proc/uptime
36.24 3.18
```

> **init:** Size 0, and `cat` prints text anyway. You met this in Power On: nobody stored `/proc/version`, and nobody stored this. The name is in a folder like any other, but behind it is kernel code that writes the text when you read, not stored bytes.
>
> **init:** And your `mv`: in X-ray, each one made one `rename`, and no `read` or `write`. Not one byte of the file moved. `rm` ended in one `unlink`: it removed a name.

## Debrief

> **init:** So a folder is a list of names, and moving a file changes a name, not its bytes. Look again at that `ls -l` line: it starts `-r--r--r--`. Every file has a lock. In Who May Enter, you learn who holds the keys.

## Real world

The same walk on a Linux machine. `~` is bash's name for your home folder, and `strace` shows the syscalls the way X-ray does:

```sh
cd /etc && pwd && cat os-release       # which Linux is this?
cd ~ && pwd                            # home again
mkdir -p /tmp/survey/maps && cp /etc/os-release /tmp/survey/maps/
ls -i /etc/os-release /tmp/survey/maps/os-release   # different inodes
mv /tmp/survey/maps/os-release /tmp/survey/maps/old && ls -i /tmp/survey/maps/old
rm -r /tmp/survey                      # remove it all, folders too. Careful.
strace mkdir /tmp/x 2>&1 | grep mkdir; rmdir /tmp/x
```

Most distributions use GNU's tools on a 64-bit PC: there `strace` shows `openat`, `renameat2` and `unlinkat` where the Machine shows `open`, `rename` and `unlink`. The kernel underneath is the same.
