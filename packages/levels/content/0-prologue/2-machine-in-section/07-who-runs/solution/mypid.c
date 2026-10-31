#include <stdio.h>
#include <unistd.h>

int main(void)
{
	printf("I am process %d\n", (int)getpid());
	printf("My parent is %d\n", (int)getppid());
	return 0;
}
