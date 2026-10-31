#include <fcntl.h>
#include <stdio.h>
#include <unistd.h>

/*
 * init: One file, opened, read and written out, with every answer from the
 * Kernel checked. The same three calls work on a file on the disk, in /proc
 * and in /sys: only the path changes.
 */
int main(void)
{
	const char *path = "/etc/motd";
	char buf[256];
	ssize_t n;
	int fd;

	fd = open(path, O_RDONLY);
	if (fd < 0) {
		perror(path);
		return 1;
	}
	n = read(fd, buf, sizeof(buf));
	if (n < 0) {
		perror("read");
		close(fd);
		return 1;
	}
	if (write(STDOUT_FILENO, buf, n) != n) {
		close(fd);
		return 1;
	}
	if (close(fd) < 0) {
		perror("close");
		return 1;
	}
	return 0;
}
