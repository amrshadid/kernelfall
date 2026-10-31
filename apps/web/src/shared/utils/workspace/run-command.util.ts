const C_SUFFIX = '.c'
const MAKEFILE_NAMES: readonly string[] = ['Makefile', 'makefile', 'GNUmakefile']

const isCSource = (path: string) => path.endsWith(C_SUFFIX)

/** `a.c` → `gcc -Wall -Wextra a.c -o a && ./a`, with the warnings the levels expect to be clean. */
export function buildAndRunCommand(source: string): string {
  const program = source.endsWith(C_SUFFIX) ? source.slice(0, -C_SUFFIX.length) : source
  return `gcc -Wall -Wextra ${source} -o ${program} && ./${program}`
}

/** `make` when there is a Makefile, otherwise build and run the open C file. */
export function defaultRunCommand(paths: readonly string[], activePath: string): string {
  if (paths.some((path) => MAKEFILE_NAMES.includes(path))) {
    return 'make'
  }
  const source = isCSource(activePath) ? activePath : paths.find(isCSource)
  return source === undefined ? 'make' : buildAndRunCommand(source)
}
