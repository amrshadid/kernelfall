#include <stdio.h>
#include <sys/utsname.h>

/*
 * init: The uname command asks the Kernel who it is. So can you.
 *
 * struct utsname is a record: a few named fields kept together. uname(&u)
 * asks the Kernel to fill in the record u, and answers 0 when it did.
 *
 *   u.sysname   the kernel's name
 *   u.release   its release
 *   u.machine   the CPU type
 *
 * printf() prints its format, putting the next piece of text wherever the
 * format says %s.
 */
int main(void)
{
	struct utsname u;

	if (uname(&u) < 0)
		return 1;
	printf("%s %s\n", u.sysname, u.release);
	return 0;
}
