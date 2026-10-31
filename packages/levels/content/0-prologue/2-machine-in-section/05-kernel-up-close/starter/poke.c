#include <stdio.h>

/*
 * Where the kernel's own code starts on 32-bit x86 when it isn't moved at
 * boot: 16 MiB above 0xc0000000, where kernel space begins.
 */
#define KERNEL_TEXT 0xc1000000UL

int main(void)
{
	volatile const unsigned char *kernel =
		(const unsigned char *)KERNEL_TEXT;

	printf("the kernel's first byte: %u\n", *kernel);
	return 0;
}
