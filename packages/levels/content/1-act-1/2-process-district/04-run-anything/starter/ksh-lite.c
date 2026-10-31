#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/wait.h>
#include <unistd.h>

#define LINE_SIZE 256
#define ARGS_MAX 32

/* The status of the last command: what `exit` with no argument returns. */
static int last_status;

/*
 * Runs a command that isn't a builtin, like `ls /`, and returns its exit
 * status the way a shell reports it (0 for success).
 */
static int run_external(char **argv)
{
	dprintf(STDERR_FILENO, "ksh-lite: %s: not implemented yet\n", argv[0]);
	return 127;
}

/* Splits `line` at spaces and tabs into `argv`, ending it with NULL. Returns argc. */
static int split(char *line, char **argv)
{
	int argc = 0;
	char *p = line;

	while (argc < ARGS_MAX - 1) {
		while (*p == ' ' || *p == '\t')
			p++;
		if (!*p)
			break;
		argv[argc++] = p;
		while (*p && *p != ' ' && *p != '\t')
			p++;
		if (*p)
			*p++ = '\0';
	}
	argv[argc] = NULL;
	return argc;
}

/* Runs one command. Returns 1 when the shell should exit, 0 to read the next line. */
static int dispatch(char **argv)
{
	if (strcmp(argv[0], "exit") == 0) {
		if (argv[1])
			last_status = atoi(argv[1]);
		return 1;
	}
	last_status = run_external(argv);
	return 0;
}

/*
 * Reads one line into `buf`, without its newline. A terminal hands over one
 * line per read(). Returns 0 at the end of input (Ctrl-D).
 */
static int read_line(char *buf, size_t size)
{
	ssize_t n = read(STDIN_FILENO, buf, size - 1);

	if (n <= 0)
		return 0;
	if (buf[n - 1] == '\n')
		n--;
	buf[n] = '\0';
	return 1;
}

int main(void)
{
	char line[LINE_SIZE];
	char *argv[ARGS_MAX];

	for (;;) {
		printf("ksh$ ");
		/* stdout holds text until a newline, and the prompt has none. */
		fflush(stdout);
		if (!read_line(line, sizeof(line)))
			break;
		if (split(line, argv) == 0)
			continue;
		if (dispatch(argv))
			break;
	}
	return last_status;
}
