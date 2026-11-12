import { describe, expect, it } from 'vitest'
import { recordedCommand } from '@/test/fixtures/recorded-runs.fixture'
import { consoleTextOf, diagnosticsSummary, gccDiagnosticsOf, offsetOfColumn } from './gcc-diagnostics.util'

const ESC = String.fromCharCode(27)

describe('gccDiagnosticsOf', () => {
  it("reads the error of a build recorded on the Machine: First Words' missing semicolon", async () => {
    const { events } = await recordedCommand(
      'prologue-boot-path-02-first-words',
      'broken',
      'gcc -Wall -Wextra hello.c -o hello && ./hello'
    )
    expect(gccDiagnosticsOf(consoleTextOf(events))).toEqual([
      { path: 'hello.c', line: 19, column: 17, severity: 'error', message: "expected ';' before '}' token" },
    ])
  })

  it('reads errors and warnings through the colours gcc prints on a terminal, each once, without the notes', () => {
    const bold = (text: string) => `${ESC}[01m${ESC}[K${text}${ESC}[m${ESC}[K`
    const output = [
      `${bold('ksh.c:')} In function '${bold('main')}':`,
      `${bold('ksh.c:14:9:')} ${ESC}[01;35m${ESC}[Kwarning: ${ESC}[m${ESC}[Kunused variable '${bold('n')}' [-Wunused-variable]`,
      '   14 |     int n;',
      `${bold('./util.h:3:1:')} ${ESC}[01;31m${ESC}[Kerror: ${ESC}[m${ESC}[Kunknown type name 'sizet'`,
      `${bold('./util.h:3:1:')} ${ESC}[01;36m${ESC}[Knote: ${ESC}[m${ESC}[Kdid you mean 'size_t'?`,
      `${bold('ksh.c:14:9:')} ${ESC}[01;35m${ESC}[Kwarning: ${ESC}[m${ESC}[Kunused variable '${bold('n')}' [-Wunused-variable]`,
      'ksh.c:2:10: fatal error: nosuch.h: No such file or directory',
    ].join('\n')
    expect(gccDiagnosticsOf(output)).toEqual([
      { path: 'ksh.c', line: 14, column: 9, severity: 'warning', message: "unused variable 'n' [-Wunused-variable]" },
      { path: 'util.h', line: 3, column: 1, severity: 'error', message: "unknown type name 'sizet'" },
      { path: 'ksh.c', line: 2, column: 10, severity: 'error', message: 'nosuch.h: No such file or directory' },
    ])
  })

  it("drops the link gcc 15 wraps around a warning's option", () => {
    const BEL = String.fromCharCode(7)
    const url = 'https://gcc.gnu.org/onlinedocs/gcc-15.2.0/gcc/Warning-Options.html#index-Wno-unused-variable'
    const output = `hello.c:5:13: warning: unused variable 'unused' [${ESC}]8;;${url}${BEL}-Wunused-variable${ESC}]8;;${BEL}]\n`
    expect(gccDiagnosticsOf(output)[0]?.message).toBe("unused variable 'unused' [-Wunused-variable]")
  })

  it('finds nothing in a clean build or a program’s own output', () => {
    expect(gccDiagnosticsOf('hello, kernel\n')).toEqual([])
    expect(gccDiagnosticsOf('note.txt:3:1: error: not a C file\n')).toEqual([])
  })
})

describe('offsetOfColumn', () => {
  it('counts a tab up to the next multiple of 8, as gcc does', () => {
    // First Words: gcc reports column 17 for the end of "\treturn 0".
    expect(offsetOfColumn('\treturn 0', 17)).toBe(9)
    expect(offsetOfColumn('\treturn 0', 9)).toBe(1)
    expect(offsetOfColumn('int n;', 5)).toBe(4)
    expect(offsetOfColumn('ab\tc', 9)).toBe(3)
    expect(offsetOfColumn('', 1)).toBe(0)
  })
})

describe('diagnosticsSummary', () => {
  const item = (severity: 'error' | 'warning') => ({ path: 'a.c', line: 1, column: 1, severity, message: 'm' })

  it('counts what the build said, and says nothing for a clean one', () => {
    expect(diagnosticsSummary([])).toBeNull()
    expect(diagnosticsSummary([item('error')])).toBe('gcc: 1 error, marked on its line')
    expect(diagnosticsSummary([item('warning'), item('error'), item('warning')])).toBe(
      'gcc: 1 error, 2 warnings, marked on their lines'
    )
  })
})
