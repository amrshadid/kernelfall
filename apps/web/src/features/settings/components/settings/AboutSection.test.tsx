// @vitest-environment jsdom
import { aboutOf } from '@shared/utils/app'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { AboutSection } from './AboutSection'

afterEach(cleanup)

const REPO = 'https://github.com/example/kernelfall'
const hrefOf = (name: string) => screen.getByRole('link', { name }).getAttribute('href')

describe('AboutSection', () => {
  it('shows the version with its release, and where each version is described', () => {
    render(<AboutSection about={aboutOf('0.1.0-alpha.1', '', REPO)} storage="Saved in this browser" />)
    expect(screen.getByText('0.1.0-alpha.1')).toBeTruthy()
    expect(screen.getByText(/alpha 1 of The Surface/)).toBeTruthy()
    expect(hrefOf('What changed in each version')).toBe(`${REPO}/blob/main/CHANGELOG.md`)
    // A local build doesn't know its commit, so it shows none.
    expect(screen.queryByRole('link', { name: /^[0-9a-f]{7}$/ })).toBeNull()
  })

  it('links the build to its commit on a hosted build', () => {
    render(<AboutSection about={aboutOf('0.1.0', '1f289231c0ffee', REPO)} storage="Saved in this browser" />)
    expect(hrefOf('1f28923')).toBe(`${REPO}/commit/1f289231c0ffee`)
  })

  it('links the source and invites the player to take part', () => {
    render(<AboutSection about={aboutOf('0.1.0', '', REPO)} storage="Saved in this browser" />)
    expect(hrefOf('Source on GitHub')).toBe(REPO)
    expect(hrefOf('How to contribute')).toBe(`${REPO}/blob/main/CONTRIBUTING.md`)
    expect(hrefOf("What's next")).toBe(`${REPO}/blob/main/docs/ROADMAP.md`)
    expect(hrefOf("Report something that doesn't match real Linux")).toBe(`${REPO}/issues/new/choose`)
    for (const link of screen.getAllByRole('link')) {
      expect(link.getAttribute('rel')).toBe('noreferrer')
    }
  })
})
