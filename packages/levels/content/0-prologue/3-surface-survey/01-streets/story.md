# The Streets of Userland

## Scene

> **init:** You brought the Machine up from a dead stop. Now walk with me. You can't fix a city you've never seen.
>
> **init:** _Userland_ is where programs live, outside the kernel: me, your shell, every command you've typed. Its streets are the folders of one big tree: `/bin`, `/etc`, `/home`, `/tmp`, `/usr`. Every house is a file.
>
> **The Watchdog:** And every step you take asks the kernel. Same as before.
>
> **init:** Today you don't just look. You build a little: make folders, copy, rename, clean up. Like moving into a house.

## See it

> **init:** First: where are you? Every process has a _working directory_, the folder it is "standing in". Type `pwd`, for "print working directory".

```
$ pwd
/home/you
```

> **init:** `pwd` is built into bash, like `echo`. Bash keeps the path of its working directory in its own memory and prints it: X-ray shows a single `writev`, the call that puts the text on your screen, and nothing else.

```
$ type pwd
pwd is a shell builtin
```

> **init:** There are several ways to name the same file. A path that starts with `/` is _absolute_: walked from the root. Any other path is _relative_: walked from where you stand. `..` means "the folder one up".

```
$ cat /etc/motd          # absolute: starts at the root /
$ cat ../../etc/motd     # relative: up to /home, up to /, down into etc
$ cd /etc
$ cat motd               # relative to the new working directory
```

> **init:** Watch `cd /etc` in X-ray. No program starts. Bash makes the call itself: `chdir("/etc") = 0`. It has to: a working directory belongs to one process. A program started for the job would move itself, exit, and leave the shell where it was.
>
> **init:** Then `cd ..`. X-ray shows `chdir("/")`, not `".."`: bash remembers the path it walked, works out the new one itself, and hands the kernel the result.

Now a folder, read. `ls /`, with the calls X-ray shows (trimmed):

```
open("/", O_RDONLY|O_LARGEFILE|O_CLOEXEC|O_DIRECTORY) = 3
getdents64(3, /* 20 entries */, 2048)  = 488
statx(AT_FDCWD, "/bin", ...)           = 0
...                                      one statx per name
statx(AT_FDCWD, "/var", ...)           = 0
getdents64(3, /* 0 entries */, 2048)   = 0
close(3)                               = 0
writev(1, "\e[1;34mbin\e[m    ...", ...) = 150    one per line on your screen
writev(1, "\e[1;34mboot\e[m   ...", ...) = 150
```

```
bin    dev    home   media  opt    root   sbin   sys    usr
boot   etc    lib    mnt    proc   run    srv    tmp    var
```

> **init:** A folder is a file too: a list of names. `ls` opens it (`O_DIRECTORY` says "this must be a folder"), reads the names with `getdents64` until it answers 0, the end, asks `statx` what kind of file each name is, sorts them, and writes them out.
>
> **init:** Twenty entries, eighteen names. The other two are `.` (this folder) and `..` (the one above), which `ls` hides unless you add `-a`. And `root` is root's home folder, not the top of the tree: that's `/`.
>
> **init:** 150 bytes for nine short names? `ls` paints each folder's name blue for the terminal: `\e[1;34m` before it, "bold blue", and `\e[m` after, "back to normal". The terminal turns those codes into colour and never shows them.

`O_LARGEFILE` is in every `open` on the Machine: it lets a 32-bit program open files bigger than 2 GiB, and the Machine's C library adds it for you.

And a file, read. `cat motd`, from `/etc`:

```
open("motd", O_RDONLY|O_LARGEFILE)     = 3
sendfile64(1, 3, NULL, 16777216)       = 124
sendfile64(1, 3, NULL, 16777216)       = 0
close(3)                               = 0
```

> **init:** `cat` never holds the text itself. `sendfile64` asks the kernel to copy from file descriptor 3, the file, straight to 1, your terminal, up to 16 MiB at a time. The kernel answers 124: that many bytes moved. The next call answers 0: the end of the file.

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
$ cat ../../etc/motd
Welcome to the Machine.
The kernel panicked tonight, and every process froze.
Find the way down, and bring the kernel back.
```

> **init:** Compare the two in X-ray. `cd home/you` arrives as `chdir("/home/you")`: bash made the path absolute itself, so the kernel can't tell it from `cd /home/you`. `cat` is different: `open("../../etc/motd", O_RDONLY|O_LARGEFILE) = 3`. The kernel got the relative path and walked it from `cat`'s working directory, `/home/you`: up to `/home`, up to `/`, down into `etc`.

Making folders. `-p` makes every missing folder on the way, so the last line makes `notes` and `old` at once:

```
$ mkdir /tmp/survey
$ mkdir /tmp/survey/maps
$ mkdir -p /tmp/survey/notes/old
```

Copying. Then `ls -i` shows each name's _inode_ number: the kernel's record of one file, with its size, its owner and where its data lies. The data itself is kept apart, and the inode points to it.

```
$ cp /etc/motd /tmp/survey/maps/motd
$ cp /etc/os-release /tmp/survey/maps/
$ ls -i /etc/motd /tmp/survey/maps/motd
    142 /etc/motd                    6 /tmp/survey/maps/motd
```

> **init:** Two different numbers: a copy is a new file. Your numbers may differ from mine; what matters is that they differ from each other.

Moving and renaming:

```
$ cd /tmp/survey/maps
$ ls -i motd
      6 motd
$ mv motd motd.old
$ ls -i motd.old
      6 motd.old
$ mv motd.old ../notes/
```

> **init:** The same number before and after, and again in `notes`. The file didn't move. Only its name did.

Here the street picture stops being true. A folder isn't a place where a file sits: it is a list of names, each pointing at an inode. Moving a file inside one filesystem only rewrites that list.

Removing:

```
$ rm ../notes/motd.old
$ rmdir ../notes
rmdir: '../notes': Directory not empty
```

> **init:** `notes` still holds `old`, and `rmdir` removes only empty folders. Now finish the errand: leave `/tmp/survey` holding exactly `maps/os-release` and an empty `notes/`, and stand in `/tmp/survey`. `ls -R /tmp/survey` shows every folder inside, one after another.

X-ray on the new commands:

```
mkdir("/tmp/survey", 0777)                                    = 0
mkdir("/", 0777)                                              = -1 EEXIST (File exists)
statx(AT_FDCWD, "/", ...)                                     = 0
mkdir("/tmp/", 0777)                                          = -1 EEXIST (File exists)
statx(AT_FDCWD, "/tmp/", ...)                                 = 0
mkdir("/tmp/survey/", 0777)                                   = -1 EEXIST (File exists)
statx(AT_FDCWD, "/tmp/survey/", ...)                          = 0
mkdir("/tmp/survey/notes/", 0777)                             = 0
mkdir("/tmp/survey/notes/old", 0777)                          = 0
open("/etc/motd", O_RDONLY|O_LARGEFILE)                       = 3
open("/tmp/survey/maps/motd", O_WRONLY|O_CREAT|O_EXCL|O_LARGEFILE, 0100644) = 4
sendfile64(4, 3, NULL, 16777216)                              = 124
rename("motd", "motd.old")                                    = 0
unlink("../notes/motd.old")                                   = 0
rmdir("../notes")                                             = -1 ENOTEMPTY (Directory not empty)
```

> **init:** `mkdir -p` tries every folder on the way, from `/` down. The kernel answers `EEXIST`, "already there", for the ones that were, and `mkdir` checks with `statx` that each is a folder before it goes on. The copy opens a new file (`O_CREAT|O_EXCL`: make it, and fail if it exists) and has the kernel fill it.
>
> **init:** Look at the `mv`. One `rename`: no `read`, no `write`, no `sendfile64`. Not one byte moved. The folder just got a new name for the same file.
>
> **init:** And the `rm`. `unlink` removed the name. There's no bin to fish it out of.

## Watch it

> **init:** Before you look: how big is `/proc/uptime` on the disk? You've seen `/proc` answer a `read` before.

```
$ ls -l /proc/uptime
-r--r--r--    1 root     root             0 Oct 31 16:31 /proc/uptime
$ cat /proc/uptime
28.17 3.34
```

> **init:** Size 0, and `cat` prints text anyway. Nothing is stored there. The kernel writes the numbers at the moment `cat` asks: seconds since the Machine started, and how many of those seconds the CPU sat idle. On a computer with more CPUs, the second number adds up the idle time of every one. Your numbers will differ; that's the point. The letters at the start of that `ls -l` line are the next lesson.
>
> **The Watchdog:** The street signs are lit. Every folder you walked.

The Kernel Map gets its first Userland outline, still dark inside.

## Debrief

> **init:** Now you know the streets, and you can change them. And you've already seen a lock without knowing it: `-r--r--r--`, at the start of that `ls -l` line.
>
> **init:** Every house has a lock. Next, in Who May Enter: who holds the keys.

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

Most distributions use GNU's tools instead of BusyBox, and a 64-bit PC: there `strace` shows `openat`, `renameat2` and `unlinkat` instead of `open`, `rename` and `unlink`, and GNU `cp` (coreutils 9) first asks the filesystem to share the data with an `ioctl(FICLONE)`, a "reflink", then has the kernel copy with `copy_file_range`. The kernel underneath is the same.
