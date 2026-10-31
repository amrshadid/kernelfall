#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/wait.h>
#include <unistd.h>

#define LINE_SIZE 256
#define ARGS_MAX 32
/* What shells return for a command they couldn't run. */
#define STATUS_NOT_FOUND 127
#define STATUS_SIGNAL_BASE 128

/* The status of the last command: what `exit` with no argument returns. */
static int last_status;

/*
 * Runs a command that isn't a builtin, like `ls /`, and returns its exit
 * status the way a shell reports it (0 for success).
 */
static int run_external(char **argv)
{
	int status;
	pid_t pid = fork();

	if (pid < 0) {
		dprintf(STDERR_FILENO, "ksh-lite: fork: %s\n", strerror(errno));
		return 1;
	}
	if (pid == 0) {
		execvp(argv[0], argv);
		if (errno == ENOENT)
			dprintf(STDERR_FILENO,
				"ksh-lite: %s: command not found\n", argv[0]);
		else
			dprintf(STDERR_FILENO, "ksh-lite: %s: %s\n", argv[0],
				strerror(errno));
		_exit(STATUS_NOT_FOUND);
	}
	if (waitpid(pid, &status, 0) < 0) {
		dprintf(STDERR_FILENO, "ksh-lite: waitpid: %s\n",
			strerror(errno));
		return 1;
	}
	if (WIFEXITED(status))
		return WEXITSTATUS(status);
	return STATUS_SIGNAL_BASE + WTERMSIG(status);
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
