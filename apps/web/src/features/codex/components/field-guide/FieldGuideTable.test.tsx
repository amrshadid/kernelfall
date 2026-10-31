// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { FieldGuideTable } from './FieldGuideTable'

afterEach(cleanup)

describe('FieldGuideTable', () => {
  it('draws one table per part, with linked and plain syscalls', () => {
    render(
      <FieldGuideTable
        sections={[
          {
            title: 'Commands',
            rows: [
              {
                name: 'cat',
                what: 'copy files to standard output',
                syscalls: [
                  { text: 'openat', href: null },
                  { text: 'write', href: '#/codex/write-syscall' },
                ],
                syscallNote: null,
                firstMet: 'P.1 Power On',
                deepenedIn: ['1.6', '2.5'],
              },
            ],
          },
        ]}
      />
    )
    expect(screen.getByRole('table', { name: 'Commands' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'write' }).getAttribute('href')).toBe('#/codex/write-syscall')
    expect(screen.queryByRole('link', { name: 'openat' })).toBeNull()
    expect(screen.getByRole('rowheader').textContent).toBe('cat')
  })
})
