# Finding the Hardware

## Scene

> **init:** A kernel isn't built for one machine. The same 6.18 runs on laptops, phones and servers. So at every boot it has to find out what it's sitting on.
>
> **The Watchdog:** And give every part a driver. A part without a driver is furniture.
>
> **init:** A _driver_ is the piece of the Kernel that knows how to work one kind of device: this network card, that disk. Without one, the Kernel can see the device but can't use it.
>
> **init:** On machines like ours, the firmware hands over a description and the Kernel asks around for the rest. On small boards, someone wrote the description by hand. You'll read both.

## See it

Devices are connected to the CPU by **buses**: the wiring, and the rules for talking over it. PCI connects the cards inside a PC, USB the devices you plug in, I²C the small chips on a board. There are two ways for the Kernel to find out what's there, depending on the machine.

- **PCs and servers, like the Machine.** The firmware provides **ACPI** tables that describe the board: the CPUs, the memory, the power button, and devices that can't announce themselves. The rest the Kernel **enumerates**: it asks each slot of a bus that can answer. On **PCI**, every device answers with a vendor ID (who made it) and a device ID (which model). PCs normally use no device tree.
- **Most ARM and RISC-V boards: phones, a Raspberry Pi, routers.** Many of their devices sit at fixed addresses and can't announce themselves, so a **device tree** describes them. It is written as text (a `.dts` file), compiled by a tool called `dtc` into a binary `.dtb`, and handed to the Kernel by the bootloader. (Arm servers usually use ACPI instead.)

> **init:** Let's look at the Machine's bus. Run `lspci -k`.

```
$ lspci -k
00:00.0 Host bridge: Intel Corporation 82G33/G31/P35/P31 Express DRAM Controller
	Subsystem: Red Hat, Inc. QEMU Virtual Machine
00:01.0 SCSI storage controller: Red Hat, Inc. Virtio block device
	Subsystem: Red Hat, Inc. Device 0002
	Kernel driver in use: virtio-pci
00:02.0 Ethernet controller: Intel Corporation 82540EM Gigabit Ethernet Controller (rev 03)
	Subsystem: Red Hat, Inc. QEMU Virtual Machine
	Kernel driver in use: e1000
	Kernel modules: e1000
$ cat /sys/bus/pci/devices/0000:00:02.0/vendor /sys/bus/pci/devices/0000:00:02.0/device
0x8086
0x100e
$ ls -l /sys/bus/pci/devices/0000:00:02.0/driver
lrwxrwxrwx 1 root root 0 Jan  1 00:00 /sys/bus/pci/devices/0000:00:02.0/driver -> ../../../bus/pci/drivers/e1000
```

> **init:** Three devices: the host bridge that joins the bus to the CPU, the disk, and the network card. `/sys` is a folder the Kernel fills with what it knows about devices, one small file per fact. `0x8086` is Intel's vendor number. `Subsystem` names who built the board the chip sits on: here, QEMU, the program that plays the Machine's hardware. `rev 03` is the chip's revision.
>
> **init:** The last line is a _link_: a file that points to another path, shown with `->`. It says the card's driver is `e1000`.

**Binding.** The drawing shows the **driver model**: a **bus** (PCI), its **devices** (what was found) and its **drivers** (code that can run a kind of device). When a device and a driver are on the same bus, the bus **matches** them; for PCI it compares the device's IDs with a list of IDs in the driver. The driver's `probe()` function then takes the device over, and the `driver` link appears.

> **udev:** (from the drawing) When a device turns up, the Kernel announces it. I'm a program in Userland that listens. If the driver is a module, I ask for it to be loaded, and I give the device a door in `/dev`.

**Registers and interrupts.** A driver controls its device through the device's **registers**: small slots it can read or write, like "start sending", "how many bytes arrived" or "lamp on". On most hardware they appear at memory addresses (**MMIO**, memory-mapped I/O), so the driver reads and writes them like memory. The device gets the CPU's attention with an **interrupt**: a signal that makes the CPU pause what it's doing and run the driver's handler. A key pressed, a network packet arrived, a timer went off: each is an interrupt.

Where the "tap on the shoulder" picture stops being true: the CPU doesn't decide to look. The hardware forces a jump into the Kernel's code between two instructions, whatever was running.

```
$ cat /proc/interrupts
           CPU0       CPU1
  0:         48          0   IO-APIC   2-edge      timer
 11:        301          0   IO-APIC  11-fasteoi   eth0
 ...
```

> **ksoftirqd:** (from the drawing) The handler does the urgent part. The rest, I finish later.

**A device tree.** `lighthouse.dts` describes a small ARM board: Socket Harbor's lighthouse controller. The board is made up, but it is written with real bindings, the real names that real drivers recognize.

Each `{ }` block is a **node**: one device, or a group of them. `reg` gives a device's register addresses; `compatible` names what the device is. At boot, the Kernel compares each node's `compatible` text with every driver's `of_match_table`, its list of names it can handle. The GPIO controller is a chip whose pins software can switch on and off; the lamp is wired to its pin 4.

## Build it

> **init:** Two errands. First, on the Machine: find the disk's PCI address and the name of its driver. Read the disk's `driver` link in `/sys` yourself, not only what `lspci` says.
>
> **init:** Then the lighthouse board. Press Boot in the board panel and watch which drivers take which nodes.

The GPIO controller binds, but the lamp has no driver. This is the `of_match_table` of the Kernel's GPIO LED driver, from `drivers/leds/leds-gpio.c`:

```
static const struct of_device_id of_gpio_leds_match[] = {
	{ .compatible = "gpio-leds", },
	{},
};
```

> **init:** Read the two `compatible` texts, the node's and the driver's, and fix the one in `lighthouse.dts`. Then compile it and boot the board again.

```
$ dtc -I dts -O dtb -o lighthouse.dtb lighthouse.dts
```

`-I dts` says the input is text, `-O dtb` asks for the binary, and `-o` names the file to write.

## Watch it

> **init:** Before you boot it: the node says `gpio-led`, the driver's list says `gpio-leds`. Will the Kernel treat them as the same?

No: matching compares the whole text. After the fix, the board panel shows the driver taking the lamp, and the lamp lights:

```
leds-gpio leds: probed
$ ls /sys/class/leds
lighthouse:lamp
```

At the bottom of the Section drawing, the hardware floor fills in: a CPU, 512 MiB of RAM, the disk and the network card, each with a line to its driver. Far away on the map, a tiny light blinks at Socket Harbor, then goes out again.

> **init:** That board's not ours yet. We'll get there.

## Debrief

> **init:** So the Kernel finds its hardware: ACPI and the PCI bus here, a device tree on boards like that one. Buses match devices to drivers, drivers take them over.
>
> **init:** Now the floor above the hardware. Who gets to use the CPU? Let's count who's running.

## Real world

On any Linux PC:

```
lspci -k                                   # PCI devices and their drivers
ls /sys/bus/pci/drivers                    # every PCI driver the kernel has now
cat /proc/interrupts                       # who interrupts the CPU, and how often
ls /sys/firmware/devicetree/base 2>/dev/null || echo "no device tree (normal on x86)"
```

On a Raspberry Pi or another ARM board, `ls /proc/device-tree` shows the live tree, and `dtc -I fs -O dts /proc/device-tree` turns it back into text.
