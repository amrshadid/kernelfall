# Finding the Hardware

## Scene

> **init:** You asked how the kernel knows what hardware it has. Nobody tells it at the factory. The same 6.18 source is built for laptops, phones and servers, so at every boot the kernel has to find out what it's sitting on.
>
> **The Watchdog:** And give every part a driver. A part without a driver is furniture.
>
> **init:** A _driver_ is the piece of the kernel that knows how to work one kind of device: this network card, that disk. Without one, the kernel can see the device but can't use it.
>
> **init:** On machines like ours, the kernel asks around. On small boards, someone wrote the description by hand. You'll read both.

## See it

Devices are connected to the CPU by **buses**: the wiring, and the rules for talking over it. PCI connects the cards inside a PC, USB the devices you plug in, I²C the small chips on a board. There are two ways for the kernel to find out what's there, depending on the machine.

- **PCs and servers, like the Machine.** Most PCs' firmware provides **ACPI** tables that describe the board: the CPUs, the memory, the power button, and devices that can't announce themselves. The rest the kernel **enumerates**: it asks each slot of a bus that can answer. On **PCI**, every device answers with a vendor ID (who made it) and a device ID (which model). PCs normally use no device tree.
- **Most ARM and RISC-V boards: phones, a Raspberry Pi, routers.** Many of their devices sit at fixed addresses and can't announce themselves, so a **device tree** describes them. It is written as text (a `.dts` file), compiled by a tool called `dtc` into a binary `.dtb`, and handed to the kernel by the bootloader. (Arm servers usually use ACPI instead.)

> **init:** The Machine's firmware is old and plain: it hands over no ACPI tables at all. `ls /sys/firmware` shows only `memmap`, the firmware's list of where the RAM is. So the kernel finds the Machine's devices by asking the PCI bus, and by knowing where an old PC keeps its fixed parts. Let's look at the bus. Run `lspci -k`.

```
$ lspci -k
00:00.0 Host bridge: Intel Corporation 440FX - 82441FX PMC [Natoma] (rev 02)
00:01.0 ISA bridge: Intel Corporation 82371SB PIIX3 ISA [Natoma/Triton II]
00:06.0 Unclassified device [0002]: Red Hat, Inc. Virtio 9P transport (rev 01)
	Subsystem: Red Hat, Inc. Device 0009
	Kernel driver in use: virtio-pci
00:0a.0 Unclassified device [0002]: Red Hat, Inc. Virtio 1.0 network device (rev 01)
	Subsystem: Red Hat, Inc. Device 0001
	Kernel driver in use: virtio-pci
00:12.0 VGA compatible controller: Device 1234:1111
	Subsystem: Red Hat, Inc. Device 1100
00:1e.0 IDE interface: Intel Corporation 82371SB PIIX3 IDE [Natoma/Triton II]
	Subsystem: ASUSTeK Computer Inc. Device 82d4
	Kernel driver in use: ata_piix
```

> **init:** Six devices. Each line starts with the device's PCI address: bus `00`, slot, function. The _host bridge_ joins the bus to the CPU and memory; the _ISA bridge_ leads to the old PC parts, like the keyboard and the clock. Then the virtio share that carries the Machine's files, the network card, the screen (`VGA`), and the disk's controller, `IDE`.
>
> **init:** These are the chips of a PC from the 1990s, Intel's 440FX and PIIX3, played by v86, the program that emulates the Machine's hardware in your browser. The two virtio devices were never chips: they were designed for virtual machines, and Red Hat registered their IDs. `rev 02` is a chip's revision; `Subsystem` names who built the card around it.

The disk controller in `/sys`, a folder the kernel fills with what it knows about devices, one small file per fact:

```
$ cat /sys/bus/pci/devices/0000:00:1e.0/vendor /sys/bus/pci/devices/0000:00:1e.0/device
0x8086
0x7010
$ ls -l /sys/bus/pci/devices/0000:00:1e.0/driver
lrwxrwxrwx    1 root     root             0 Oct 31 16:17 /sys/bus/pci/devices/0000:00:1e.0/driver -> ../../../bus/pci/drivers/ata_piix
```

> **init:** `0x8086` is Intel's vendor number, `0x7010` the PIIX3's IDE controller. The last line is a _link_: a file that points to another path, shown with `->`. It says the controller's driver is `ata_piix`.

**Binding.** The drawing shows the **driver model**: a **bus** (PCI), its **devices** (what was found) and its **drivers** (code that can run a kind of device). When a device and a driver are on the same bus, the bus **matches** them; for PCI it compares the device's IDs with a list of IDs in the driver. The driver's `probe()` function then takes the device over, and the `driver` link appears.

> **init:** On most Linux systems a program called udev hears about each new device, loads its driver if that's a module, and makes friendly names. The Machine runs no udev: its few modules are loaded at boot, and the kernel makes the device files itself.

**Registers and interrupts.** A driver controls its device through the device's **registers**: small slots it can read or write, like "start sending", "how many bytes arrived" or "lamp on". On most hardware they appear at memory addresses (**MMIO**, memory-mapped I/O), so the driver reads and writes them like memory; old PC parts also use separate I/O ports. The device gets the CPU's attention with an **interrupt**: a signal that makes the CPU pause what it's doing and run the driver's handler. A key pressed, a network packet arrived, a timer went off: each is an interrupt.

Where the "tap on the shoulder" picture stops being true: the CPU doesn't decide to look. The hardware forces a jump into the kernel's code between two instructions, whatever was running. The one way to hold it off is to switch interrupts off: the kernel does that for a few instructions at a time (the `cli` instruction, `local_irq_disable()` in its code) where it must not be interrupted, and the device waits until they're back on.

```
$ cat /proc/interrupts
           CPU0
  0:      62321   XT-PIC      timer
  1:         10   XT-PIC      i8042
  2:          0   XT-PIC      cascade
  3:      58481   XT-PIC      ttyS1
  4:       6214   XT-PIC      ttyS0
  8:          0   XT-PIC      rtc0
 10:      21671   XT-PIC      virtio0, virtio1
 12:          5   XT-PIC      i8042
 14:          2   XT-PIC      ata_piix
 15:          3   XT-PIC      ata_piix
...
```

> **init:** One column: one CPU. Each row is an interrupt line, its count so far, the chip that delivers it and who handles it. `XT-PIC` is the oldest PC interrupt controller there is. Line 0 is the timer that makes the scheduler's turns. `ttyS0` is your terminal's line, `ttyS1` the one the kernel's trace travels on to X-ray. The virtio share and the network card share line 10, and the disk controller has 14 and 15.
>
> **ksoftirqd:** (from the drawing) The handler does the urgent part. The rest, I finish later.

**A device tree.** `lighthouse.dts` describes a small ARM board: Socket Harbor's lighthouse controller. The board is made up, but it is written with real bindings: the real `compatible` names that real drivers recognize, and node names the way the bindings ask for them.

Each `{ }` block is a **node**: one device, or a group of them. `reg` gives a device's register addresses; `compatible` names what the device is. The lamp is the node `led-0` inside `leds`, and its `label` is the name it gets in `/sys/class/leds`. At boot, the kernel compares each node's `compatible` text with every driver's `of_match_table`, its list of names it can handle. The GPIO controller is a chip whose pins software can switch on and off; the lamp is wired to its pin 4.

## Build it

> **init:** Two errands. First, on the Machine: you've seen the disk controller's link. Read it yourself, with `readlink`, which prints where a link points.
>
> **init:** Then the lighthouse board. Compile its tree and boot it with `board`, a program I keep for that board: it reads the `.dtb` and matches each node with the drivers the board's kernel has, as the kernel would.

```
$ dtc -I dts -O dtb -o lighthouse.dtb lighthouse.dts
$ board lighthouse.dtb
OF: fdt: Machine model: Socket Harbor lighthouse
pinctrl-bcm2835 7e200000.gpio: probed
leds: no driver matches "gpio-led"
/sys/class/leds: (none)
```

`-I dts` says the input is text, `-O dtb` asks for the binary, and `-o` names the file to write. `7e200000.gpio` is the name the kernel gives a device made from a node: its register address, then the node's name.

The GPIO controller binds, but the lamp has no driver. This is the `of_match_table` of the kernel's GPIO LED driver, from `drivers/leds/leds-gpio.c`:

```
static const struct of_device_id of_gpio_leds_match[] = {
	{ .compatible = "gpio-leds", },
	{},
};
```

> **init:** Read the two `compatible` texts, the node's and the driver's, and fix the one in `lighthouse.dts`. Then compile it and boot the board again.

## Watch it

> **init:** Before you boot it: the node says `gpio-led`, the driver's list says `gpio-leds`. Will the kernel treat them as the same?

No: matching compares the whole text. After the fix, the driver takes the lamp, and the lamp appears in the board's `/sys/class/leds`:

```
$ board lighthouse.dtb
OF: fdt: Machine model: Socket Harbor lighthouse
pinctrl-bcm2835 7e200000.gpio: probed
leds-gpio leds: probed
/sys/class/leds: lighthouse:lamp
```

At the bottom of the Section drawing, the hardware floor fills in: a CPU, 256 MiB of RAM, the disk and the network card, each with a line to its driver. Far away on the map, a tiny light blinks at Socket Harbor, then goes out again.

> **init:** That board's not ours yet. We'll get there.

## Debrief

> **init:** So the kernel finds its hardware: by asking the PCI bus here, from a device tree on boards like that one. Buses match devices to drivers, drivers take them over.
>
> **init:** Now the floor above the hardware. Who gets to use the CPU? Let's count who's running, in Who Runs.

## Real world

On any Linux PC:

```
lspci -k                                   # PCI devices and their drivers
ls /sys/bus/pci/drivers                    # every PCI driver the kernel has now
cat /proc/interrupts                       # who interrupts the CPU, and how often
ls /sys/firmware/acpi/tables               # your firmware's ACPI tables
ls /sys/firmware/devicetree/base 2>/dev/null || echo "no device tree (normal on x86)"
```

A modern PC uses an APIC rather than the XT-PIC, and has a column per CPU in `/proc/interrupts`. On a Raspberry Pi or another ARM board, `ls /proc/device-tree` shows the live tree, and `dtc -I fs -O dts /proc/device-tree` turns it back into text.
