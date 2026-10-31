# The Streets of Userland

## Scene

> **init:** The Machine's up, all the way. You've peeked into a few folders on the way. Now walk with me. You can't fix a city you've never seen.
>
> **init:** Userland is one big tree of folders. The streets are folders: `/bin`, `/etc`, `/home`, `/tmp`, `/usr`. Every house is a file.
>
> **The Watchdog:** And every step you take asks the Kernel. Same as before.
>
> **init:** Today you don't just look. You build a little: make folders, copy, rename, clean up. Like moving into a house.

## See it

> **init:** First: where are you? Every process has a _working directory_, the folder it is "standing in". Type `pwd`.

```
$ pwd
/home/you
```

> **init:** There are three ways to name the same file from here. A path that starts with `/` is _absolute_: walked from the root. Any other path is _relative_: walked from where you stand. `..` means "one folder up".

```
$ cat /etc/motd          # absolute: starts at the root /
$ cat ../../etc/motd     # relative: up to /home, up to /, down into etc
$ cd /etc
$ cat motd               # relative to the new working directory
```

> **init:** Watch `cd /etc` in X-ray. No program starts. My shell makes one call itself: `chdir("/etc") = 0`. It has to: a working directory belongs to one process, and `cd` must change the shell's own.
>
> **init:** Then `cd ..`. X-ray shows `chdir("/")`, not `".."`: my shell remembers which folders it walked through, works the new path out itself, and hands the Kernel the result. Bash does the same.

Now a folder, read. `ls /`:

```
openat(AT_FDCWD, "/", O_RDONLY|O_CLOEXEC|O_DIRECTORY) = 3
getdents64(3, /* 13 entries */, 2048) = 312
newfstatat(AT_FDCWD, "//bin", ...)    = 0
...                                     one per name
getdents64(3, /* 0 entries */, 2048)  = 0
close(3)                              = 0
write(1, "bin  ", 5)                  = 5
...
write(1, "usr", 3)                    = 3
write(1, "\n", 1)                     = 1
```

```
bin  boot  dev  etc  home  lib  proc  root  sys  tmp  usr
```

> **init:** A folder is a file too: a list of names. `ls` opens it, reads the names with `getdents64` until it gets 0, the end, sorts them, and writes them out. Thirteen entries, eleven names: the other two are `.` (this folder) and `..` (the one above), which `ls` hides without `-a`. `root` is root's home, not the top of the tree: that's `/`.

And a file, read. `cat motd`, from `/etc`:

```
openat(AT_FDCWD, "motd", O_RDONLY)                     = 3
read(3, "Welcome to the Machine.\nThe ker"..., 4096) = 124
write(1, "Welcome to the Machine.\nThe ker"..., 124) = 124
read(3, "", 4096)                                      = 0
close(3)                                               = 0
```

> **init:** Same shape: open, read, write it out. A `read` that returns 0 means the end of the file.

## Build it

> **init:** Your errand: set up a survey office in `/tmp`, the scratch space anyone may write in. I'll show you each move once; then it's yours.

Moving around. Watch where you land after each `cd`:

```
$ cd /etc
$ pwd
/etc
$ cd ..
$ pwd
/
$ cd home/you
$ pwd
/home/you
```

Making folders. `-p` makes every missing folder on the way, so the last line makes `notes` and `old` at once:

```
$ mkdir /tmp/survey
$ mkdir /tmp/survey/maps
$ mkdir -p /tmp/survey/notes/old
```

Copying. Then `ls -i` shows each name's _inode_ number: the Kernel's record of one file, its data, size and owner.

```
$ cp /etc/motd /tmp/survey/maps/motd
$ cp /etc/os-release /tmp/survey/maps/
$ ls -i /etc/motd /tmp/survey/maps/motd
```

> **init:** Two different numbers. A copy is a new file.

Moving and renaming:

```
$ cd /tmp/survey/maps
$ ls -i motd
$ mv motd motd.old
$ ls -i motd.old
$ mv motd.old ../notes/
```

> **init:** The same number before and after, and again in `notes`. The file didn't move. Only its name did.

Removing:

```
$ rm ../notes/motd.old
$ rmdir ../notes
rmdir: failed to remove '../notes': Directory not empty
```

> **init:** `notes` still holds `old`. `rmdir` removes only empty folders. Now finish the errand: leave `/tmp/survey` holding exactly `maps/os-release` and an empty `notes/`, and stand in `/tmp/survey`. `ls -R /tmp/survey` shows every folder inside, one after another.

X-ray on the new commands:

```
mkdir("/tmp/survey", 0777)                                        = 0
openat(AT_FDCWD, "/etc/motd", O_RDONLY)                           = 3
openat(AT_FDCWD, "/tmp/survey/maps/motd", O_WRONLY|O_CREAT|O_EXCL, 0644) = 4
renameat2(AT_FDCWD, "motd", AT_FDCWD, "motd.old", RENAME_NOREPLACE) = 0
unlinkat(AT_FDCWD, "../notes/motd.old", 0)                        = 0
rmdir("../notes")                                                 = -1 ENOTEMPTY (Directory not empty)
```

> **init:** Look at the `mv`. No `read`, no `write`. Not one byte moved. The folder just got a new name for the same file.
>
> **init:** And the `rm`. It removed the name. There's no bin to fish it out of.

## Watch it

> **init:** Before you look: how big is `/proc/uptime` on the disk? You saw `/proc` answer a `read` before.

```
$ ls -l /proc/uptime
-r--r--r-- 1 root root 0 Jan  1 00:00 /proc/uptime
$ cat /proc/uptime
1312.47 2581.90
```

> **init:** Size 0, and `cat` prints text anyway. Nothing is stored there. The Kernel writes the numbers into the `read` right then: seconds since boot, and the seconds every CPU sat idle, added together. Your numbers will differ; that's the point. The letters at the start of that `ls -l` line are the next lesson.
>
> **The Watchdog:** The street signs are lit. Every folder you walked.

The Kernel Map gets its first Userland outline, still dark inside.

## Debrief

> **init:** Now you know the streets, and you can change them. And you passed one door you couldn't open, back in `/etc`: a house called `shadow`.
>
> **init:** Every house has a lock. Let's find out who holds the keys.

## Real world

The same walk on any Linux machine. `~` is bash's name for your home folder, and `strace` shows the syscalls the way X-ray does:

```sh
cd /etc && pwd && cat os-release       # which Linux is this?
cd ~ && pwd                            # home again
mkdir -p /tmp/survey/maps && cp /etc/os-release /tmp/survey/maps/
ls -i /etc/os-release /tmp/survey/maps/os-release   # different inodes
mv /tmp/survey/maps/os-release /tmp/survey/maps/old && ls -i /tmp/survey/maps/old
rm -r /tmp/survey                      # remove it all (-r: folders too). Careful.
strace mkdir /tmp/x 2>&1 | grep mkdir; rmdir /tmp/x
```

GNU `cp` may not show `read` and `write` at all: it first asks the kernel to copy for it (`copy_file_range`, or a clone on filesystems that share blocks).
