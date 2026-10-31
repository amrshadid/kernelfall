#include <stdio.h>
#include <unistd.h>

/*
 * init: Every process has a number, its PID, and a parent: the process that
 * started it. Only the kernel knows both, so you ask it.
 *
 *   pid_t getpid(void);    your own PID
 *
 * printf() puts a whole number wherever its format says %d.
 */
int main(void)
{
	printf("I am process %d\n", (int)getpid());
	return 0;
}
