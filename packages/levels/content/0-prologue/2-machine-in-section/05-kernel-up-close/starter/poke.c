#include <stdio.h>

/*
 * Where kernel space starts on this 32-bit Machine: the top 1 GiB of every
 * process's addresses, from 0xc0000000 up.
 */
#define KERNEL_SPACE 0xc0000000UL

int main(void)
{
	volatile const unsigned char *kernel =
		(const unsigned char *)KERNEL_SPACE;

	printf("the kernel's first byte: %u\n", *kernel);
	return 0;
}
