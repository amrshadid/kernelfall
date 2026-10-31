import { describe, expect, it } from 'vitest'
import { runAsScript, setupScript, shellQuote } from '#utils/vm-setup/setup-script.util'

const decoded = (line: string | undefined) => {
  const b64 = line?.match(/^echo (\S+) \| base64 -d/)?.[1]
  return b64 === undefined ? null : new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.codePointAt(0) ?? 0))
}

describe('setupScript', () => {
  it('gives the shared Machine an empty session and the player `you`', () => {
    const lines = setupScript({})
    expect(lines).toEqual([
      ": > '/run/kf-session'",
      expect.stringMatching(/^echo \S+ \| base64 -d > '\/run\/kf-player'$/),
    ])
    expect(decoded(lines[1])).toBe('you\n')
  })

  it("replaces an account of the same name, as S.2's guest replaces Alpine's", () => {
    const [line] = setupScript({ users: [{ name: 'guest', uid: 1001 }] })
    expect(line).toBe(
      "deluser 'guest' 2>/dev/null; addgroup -g 1001 'guest' 2>/dev/null; adduser -D -u 1001 -G 'guest' -h '/home/guest' -s '/bin/sh' 'guest'"
    )
  })

  it("creates files and folders in order, with their owner's group and mode, contents in base64", () => {
    const lines = setupScript({
      files: [
        { path: '/home/you/attic', kind: 'dir', owner: 'you' },
        { path: '/home/you/attic/plan.txt', owner: 'you', mode: 0o600, content: "it's\nhere\n" },
        { path: '/etc/empty' },
      ],
    })
    expect(lines.slice(0, 2)).toEqual([
      "mkdir -p '/home/you/attic'",
      "chown 'you:' '/home/you/attic' && chmod 755 '/home/you/attic'",
    ])
    expect(lines[2]).toMatch(
      /^mkdir -p '\/home\/you\/attic' && echo \S+ \| base64 -d > '\/home\/you\/attic\/plan.txt'$/
    )
    expect(decoded(lines[2]?.replace(/^mkdir -p \S+ && /, ''))).toBe("it's\nhere\n")
    expect(lines[3]).toBe("chown 'you:' '/home/you/attic/plan.txt' && chmod 600 '/home/you/attic/plan.txt'")
    expect(lines[4]).toBe("mkdir -p '/etc' && : > '/etc/empty'")
  })

  it('builds the bin programs with gcc after the files, from the sources given or ones already in place', () => {
    const lines = setupScript(
      {
        files: [{ path: '/usr/local/src/look.c', content: 'int main(void) { return 0; }\n' }],
        bin: ['ksh-lite', 'look'],
      },
      { 'ksh-lite': 'int main(void) { return 1; }\n' }
    )
    const build = lines.slice(2, 5)
    expect(build[0]).toMatch(/^mkdir -p \/usr\/local\/src && echo \S+ \| base64 -d > '\/usr\/local\/src\/ksh-lite.c'$/)
    expect(decoded(build[0]?.replace(/^mkdir -p \S+ && /, ''))).toBe('int main(void) { return 1; }\n')
    expect(build.slice(1)).toEqual([
      "gcc -std=c11 -Wall -Wextra -O2 -o '/usr/local/bin/ksh-lite' '/usr/local/src/ksh-lite.c'",
      "gcc -std=c11 -Wall -Wextra -O2 -o '/usr/local/bin/look' '/usr/local/src/look.c'",
    ])
    expect(lines[5]).toBe(": > '/run/kf-session'")
  })

  it("writes the session the player's shell starts in: its cwd and exports", () => {
    const lines = setupScript({ cwd: '/home/you/boards', env: { LANG: 'C', GREETING: "it's on" } })
    const session = lines.find((line) => line.endsWith("> '/run/kf-session'"))
    expect(decoded(session)).toBe("cd '/home/you/boards'\nexport LANG='C'\nexport GREETING='it'\\''s on'\n")
  })

  it('starts the running programs at the pids the story names, as the player, in their login environment', () => {
    const lines = setupScript({
      processes: [
        { argv: ['sleep', '600'], pid: 401 },
        { argv: ['yes'], stdout: '/dev/null' },
      ],
    })
    const env =
      "env -i 'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin' 'HOME=/home/you' 'USER=you' 'LOGNAME=you'"
    expect(lines.at(-2)).toBe(
      `echo 1401 > /proc/sys/kernel/ns_last_pid; (echo 400 > /proc/sys/kernel/ns_last_pid; ${env} /bin/setpriv --reuid=1000 --regid=1000 --clear-groups 'sleep' '600' < /dev/null > '/dev/console' 2>&1 &)`
    )
    expect(lines.at(-1)).toBe(
      `(${env} /bin/setpriv --reuid=1000 --regid=1000 --clear-groups 'yes' < /dev/null > '/dev/null' 2>&1 &)`
    )
  })
})

describe('runAsScript', () => {
  it('runs the line as the user between run-as markers, the line and user passed as quoted arguments', () => {
    const script = runAsScript('guest', "echo 'knock'")
    expect(script).toMatch(/^sh -c '.*' kf-as 'echo '\\''knock'\\''' 'guest'$/)
    expect(script).toContain('exec 9>/sys/kernel/tracing/trace_marker; echo $$ >> /sys/kernel/tracing/set_event_pid;')
    expect(script).toContain('kf-as-start %s')
    expect(script).toContain('su -s /bin/sh "$2" -c "$1" < /dev/null')
    expect(script).toContain('echo "kf-as-end $status" >&9')
  })
})

describe('shellQuote', () => {
  it('keeps every character literal, single quotes included', () => {
    expect(shellQuote("a b'c$d")).toBe("'a b'\\''c$d'")
  })
})
