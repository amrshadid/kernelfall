#include <unistd.h>

/*
 * init: Your first program. A program can't reach the terminal by itself; it
 * asks the Kernel with a syscall.
 *
 *   ssize_t write(int fd, const void *buf, size_t count);
 *
 * write() hands `count` bytes from `buf` to the open file `fd`, and the Kernel
 * answers with how many bytes it took, or -1 if it refused.
 *
 * Every program starts with three open files: 0 is standard input, 1 is
 * standard output (here, it leads to your terminal), 2 is standard error.
 *
 * Say something to the Machine. End your line with a newline.
 */
int main(void)
{
	return 0;
}
