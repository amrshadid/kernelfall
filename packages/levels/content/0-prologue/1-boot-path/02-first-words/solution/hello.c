#include <unistd.h>

int main(void)
{
	static const char msg[] = "hello, Machine\n";
	const ssize_t len = sizeof(msg) - 1;

	if (write(STDOUT_FILENO, msg, len) != len)
		return 1;
	return 0;
}
