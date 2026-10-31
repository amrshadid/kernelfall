#include <fcntl.h>
#include <stdio.h>
#include <unistd.h>

/*
 * init: Every variable lives at an address in this process's own map.
 * &name is the address of the variable called name, and printf() prints an
 * address where its format says %p, once you cast it to (void *).
 */
int global = 42;

/*
 * init: This prints the map the kernel keeps for this process. It opens
 * /proc/self/maps, reads it a piece at a time and writes each piece to
 * standard output. You'll write this kind of loop yourself one day.
 */
static int print_maps(void)
{
	char buf[256];
	ssize_t n;
	int fd;

	fd = open("/proc/self/maps", O_RDONLY);
	if (fd < 0)
		return -1;
	while ((n = read(fd, buf, sizeof(buf))) > 0) {
		if (write(STDOUT_FILENO, buf, n) != n) {
			close(fd);
			return -1;
		}
	}
	if (close(fd) < 0 || n < 0)
		return -1;
	return 0;
}

int main(void)
{
	printf("global at %p\n", (void *)&global);
	if (print_maps() < 0)
		return 1;
	return 0;
}
