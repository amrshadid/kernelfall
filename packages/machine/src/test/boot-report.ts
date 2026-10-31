// BOOT_REPORT_SCRIPT's output as the VM printed it (Alpine 3.24, 6.18.59-0-virt in v86); dmesg is
// cut to the lines the summary reads and a few around them, otherwise unchanged.
export const BOOT_REPORT = `@kf:dmesg
[    0.000000] Linux version 6.18.59-0-virt (buildozer@build-3-24-x86) (cc (Alpine 15.2.0) 15.2.0, GNU ld (GNU Binutils) 2.45.1) #1-Alpine SMP PREEMPT_DYNAMIC 2026-10-27 14:58:36
[    0.000000] BIOS-provided physical RAM map:
[    0.000000] BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable
[    0.132221] ... disabling SMP support. (tell your hw vendor)
[    0.132875] CPU topo: Allowing 1 present CPUs plus 0 hotplug CPUs
[    0.135237] Kernel command line: console=ttyS0 rw tsc=reliable mitigations=off random.trust_cpu=on log_buf_len=128K quiet
[    0.698672] smpboot: Total of 1 processors activated (2000.00 BogoMIPS)
[    0.699498] Memory: 220712K/245368K available (10068K kernel code, 1054K rwdata, 3828K rodata, 952K init, 272K bss, 22952K reserved, 0K cma-reserved)
[    0.778067] pci 0000:00:1e.0: [8086:7010] type 00 class 0x010180 conventional PCI endpoint
[    1.022130] Unpacking initramfs...
[    1.733345] scsi host0: ata_piix
[    2.380300] Run /init as init process
[    2.380368]   with arguments:
[    2.380430]     /init
[    3.025657] 9p: Installing v9fs 9p2000 file system support
@kf:pci
0000:00:00.0
0000:00:01.0
0000:00:06.0 virtio-pci
0000:00:0a.0 virtio-pci
0000:00:12.0
0000:00:1e.0 ata_piix
@kf:net
eth0
lo
@kf:mounts
dev /dev devtmpfs rw,relatime,size=111144k,nr_inodes=27786,mode=755 0 0
host9p / 9p rw,relatime,cache=0x5,access=client,msize=512000,trans=virtio 0 0
proc /proc proc rw,relatime 0 0
@kf:meminfo
MemTotal:         224052 kB
MemFree:          206484 kB
MemAvailable:     204424 kB
@kf:cpus
1
`
