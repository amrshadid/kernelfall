# The Boot Path

**Question:** How does the Machine get from the power button to its first program?

## Scene

> **init:** In Speak to the Shell, bash started every program you named. I started bash. So who started me? The Watchdog has restarted the Machine, so you can watch it wake.
>
> **The Watchdog:** On purpose. Once. Don't make a habit of it.
>
> **init:** _Booting_ is everything between the power button and me. Four hands pass the Machine along: firmware, bootloader, kernel, init. The second is waiting on your terminal.

## See it

```
                             GNU GRUB  version 2.14

 +----------------------------------------------------------------------------+
 |*Alpine, with Linux virt                                                    |
 |                                                                            |
 +----------------------------------------------------------------------------+

      Use the ^ and v keys to select which entry is highlighted.
      Press enter to boot the selected OS, `e' to edit the commands
      before booting or `c' for a command-line.
```

> **init:** This is GRUB, the Machine's _bootloader_: the small program that loads the kernel. The _firmware_, software stored on the board itself, ran first and started GRUB from the disk. Press `e` to see what the menu's one entry really is.

---

```
setparams 'Alpine, with Linux virt'

insmod gzio
insmod part_msdos
insmod ext2
search --no-floppy --fs-uuid --set=root 6b65726e-656c-4661-916c-000000000001
echo        'Loading Linux virt ...'
linux        /boot/vmlinuz-virt console=ttyS0 rw tsc=reliable mitigations=off random.trust_cpu=on log_buf_len=128K quiet
echo        'Loading initial ramdisk ...'
initrd        /boot/initramfs-virt
```

> **init:** One line matters today. `linux` names the kernel's file, and the words after it are the _kernel command line_: settings for this boot, with spaces between them. `console=ttyS0` sends the kernel's messages to your terminal. `quiet` keeps most of them off it.
>
> **init:** GRUB loads that file and starts it. The kernel, the third hand, wakes its own parts and then its drivers, the code for each kind of device. Next it runs the initramfs, a small set of files GRUB loaded beside it. That finds the Machine's files, attaches them at `/`, and hands over to `/sbin/init` as process 1: the fourth hand, me.

## Build it

> **init:** Boot the Machine your own way. Ctrl-N moves down to the `linux` line, and Ctrl-E jumps to its end. Take `quiet` away. Add `initcall_debug`, which makes the kernel log each start-up function it calls. Add a word of your own for me, `greeting=hello`. Ctrl-X boots what you edited.

---

> **init:** Ask what this boot was told: `cat /proc/cmdline`. The kernel's log, `dmesg`, is over a thousand lines, so send it through `|` to `grep`, which keeps only the lines holding a word: `dmesg | grep "command line"`, then `dmesg | grep serial8250_init`.

---

```
$ cat /proc/cmdline
BOOT_IMAGE=/boot/vmlinuz-virt console=ttyS0 rw tsc=reliable mitigations=off random.trust_cpu=on log_buf_len=128K initcall_debug greeting=hello
$ dmesg | grep "command line"
[    0.310190] Kernel/User page tables isolation: disabled on command line.
[    0.479757] Kernel command line: BOOT_IMAGE=/boot/vmlinuz-virt console=ttyS0 rw tsc=reliable mitigations=off random.trust_cpu=on log_buf_len=128K initcall_debug greeting=hello
[    0.484263] Unknown kernel command line parameters "greeting=hello", will be passed to user space.
$ dmesg | grep serial8250_init
[    3.264988] calling  serial8250_init+0x0/0x170 @ 1
[    3.312852] initcall serial8250_init+0x0/0x170 returned 0 after 47826 usecs
```

> **init:** The kernel didn't know `greeting=hello`, so it put it in my environment, as `env` did for `printenv`, and said so. "User space" is its name for the programs outside it. `serial8250_init` is one _initcall_, a start-up function: it set up the driver for `ttyS0`, your terminal's line. The number in brackets counts seconds since the kernel started, so it differs at each boot.

## Watch it

> **init:** Before we go on: did your edit change the next boot?
>
> - yes, the next boot uses it
> - [x] no, it was for this boot only

> **init:** No. GRUB's editor worked on a copy in memory. The entry itself is in a file on the Machine's disk, `grub.cfg`, and nobody wrote to it, so the next restart boots with `quiet` again.
>
> **init:** One last look at the first hand. Run `ls /sys/firmware/efi`.

---

```
$ ls /sys/firmware/efi
ls: /sys/firmware/efi: No such file or directory
```

> **init:** That folder exists only when the firmware is UEFI, the kind on today's PCs. The Machine's is the older kind, a BIOS. X-ray's boot view lays this boot out from the firmware to me, with the kernel's own lines at each step.

## Debrief

> **init:** Firmware, bootloader, kernel, init: now you know every hand the Machine passes through, and that the bootloader tells the kernel how to boot.
>
> **The Watchdog:** And where to look when one of them drops it.
>
> **init:** One hand is bigger than the others: the kernel. Next, I open it for you.

## Real world

```
cat /proc/cmdline                       # your kernel command line
ls /sys/firmware/efi && echo UEFI       # booted by UEFI?
ls /boot                                # the kernels and initramfs files side by side
sudo dmesg | head -n 30                 # this boot's first kernel messages
```

At the GRUB menu of a test machine or a virtual machine, press `e` and add `initcall_debug` for one boot, then read `sudo dmesg | grep initcall`. Most distributions hide the menu unless you hold Shift or press Esc while the machine starts. Never experiment on a computer you depend on.
