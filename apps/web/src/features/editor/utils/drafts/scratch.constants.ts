import type { FileContents } from '@features/editor/types'

/** A file to play with on levels that don't ship starter code yet. */
export const SCRATCH_STARTER: FileContents = {
  'hello.c': `#include <stdio.h>
#include <unistd.h>

int main(void)
{
\tprintf("hello from pid %d\\n", getpid());
\treturn 0;
}
`,
}
