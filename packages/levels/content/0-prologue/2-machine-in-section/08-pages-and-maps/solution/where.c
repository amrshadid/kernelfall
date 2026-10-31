#include <fcntl.h>
#include <stdio.h>
#include <unistd.h>

int global = 42;

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
	int local = 0;

	printf("global at %p\n", (void *)&global);
	printf("local  at %p\n", (void *)&local);
	if (print_maps() < 0)
		return 1;
	return 0;
}
