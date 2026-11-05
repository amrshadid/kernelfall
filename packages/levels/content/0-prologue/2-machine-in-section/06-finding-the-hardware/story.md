# Finding the Hardware

**Question:** How does the kernel give each device its driver?

## Scene

> **init:** The Kernel Up Close ended on a question. The kernel owns every device, but who tells it which devices it has?
>
> **init:** Mostly, nobody. The same Linux runs on laptops, phones and servers, so at every boot it finds most of its hardware itself, and hands each device to a driver, the kernel code you saw set up in The Boot Path.
>
> **The Watchdog:** A part without a driver is furniture.

## See it

> **init:** Ask the Machine's main bus what it found: run `lspci -k`.

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

> **init:** PCI is a _bus_: the wiring that joins devices to the CPU, and the rules for talking over it. At boot the kernel asks every PCI slot what is there, and each device answers with two numbers: who made it, and which model it is. The bus offers each device to the drivers, and a driver whose list holds those numbers takes it. That is how one kernel runs on any PC.
>
> **init:** Six devices. The two bridges join the bus to the CPU, memory and the PC's oldest parts, run by the kernel's core. The disk controller at `00:1e.0` went to `ata_piix`. The display controller at `00:12.0` has no driver line: its driver, `bochs`, sits unloaded in a module file.

The hardware floor of the drawing fills in with the same six parts, three of them joined by a line to a driver.

> **init:** The kernel writes down what it found in _/sys_, a tree of small files, one fact each, so programs like `lspci` can read it. Read the disk controller's numbers there.

```
$ cat /sys/bus/pci/devices/0000:00:1e.0/vendor /sys/bus/pci/devices/0000:00:1e.0/device
0x8086
0x7010
```

> **init:** `0x8086` is Intel; `0x7010` is its PIIX3 disk controller. Those two numbers are on `ata_piix`'s list.

## Build it

> **init:** Two errands. First, the same folder holds a link named `driver`: a file that points to another path. Ask where it points with `readlink`.
>
> **init:** Second, a board that can't answer. Small ARM boards, like the lighthouse controller at Socket Harbor, have devices that can't announce themselves, so someone describes them by hand in a _device tree_. Yours is `lighthouse.dts`, open in the editor. Each node names its device with a `compatible` text, and a driver takes the node if that text is on its list. `dtc` compiles the tree into the binary the kernel reads at boot, and `board`, my stand-in for the board's kernel, boots it as far as its drivers.

```
$ dtc -I dts -O dtb -o lighthouse.dtb lighthouse.dts
$ board lighthouse.dtb
OF: fdt: Machine model: Socket Harbor lighthouse
pinctrl-bcm2835 7e200000.gpio: probed
leds: no driver matches "gpio-led"
/sys/class/leds: (none)
```

> **init:** The lamp found no driver. Here is the list in the LED driver, `drivers/leds/leds-gpio.c`:

```
static const struct of_device_id of_gpio_leds_match[] = {
	{ .compatible = "gpio-leds", },
	{},
};
```

> **init:** Fix the lamp's `compatible` in `lighthouse.dts`, then compile and boot the board again.

## Watch it

> **init:** Before you boot it: the node said `gpio-led`, the list says `gpio-leds`. Close enough for the kernel?

```
$ board lighthouse.dtb
OF: fdt: Machine model: Socket Harbor lighthouse
pinctrl-bcm2835 7e200000.gpio: probed
leds-gpio leds: probed
/sys/class/leds: lighthouse:lamp
```

> **init:** Not close enough: the kernel compares the whole text, and one letter short leaves the lamp dark. With the match, `leds-gpio` takes the lamp, the way `ata_piix` took the disk controller. On a PC the bus matches numbers; on a board, the device tree's names.
>
> **init:** The lamp's `label` in the tree, `lighthouse:lamp`, is the name it now has in the board's `/sys/class/leds`.

Far away on the map, a light blinks once at Socket Harbor, then goes out.

## Debrief

> **init:** You can find which driver runs a device, and give a board's device its driver. Each device goes to a driver whose list matches it. Next, another part of the kernel: one CPU, and many programs that want it. Who decides? Find out in Who Runs.

## Real world

On any Linux PC:

```
lspci -k                                   # PCI devices and their drivers
ls /sys/bus/pci/drivers                    # every PCI driver the kernel has now
cat /proc/interrupts                       # which device interrupts the CPU, how often
ls /sys/firmware/devicetree/base 2>/dev/null || echo "no device tree, as on most PCs"
```

On a Raspberry Pi or another ARM board, `ls /proc/device-tree` shows the live tree, and `dtc -I fs -O dts /proc/device-tree` turns it back into text.
