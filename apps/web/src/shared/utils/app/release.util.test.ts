import { describe, expect, it } from 'vitest'
import { aboutOf, releaseNameOf, stageOf } from './release.util'

const REPO = 'https://github.com/example/kernelfall'

describe('releaseNameOf', () => {
  it("names the roadmap's milestone a version belongs to", () => {
    expect(releaseNameOf('0.1.0-alpha.1')).toBe('The Surface')
    expect(releaseNameOf('0.1.3')).toBe('The Surface')
    expect(releaseNameOf('0.2.0')).toBe('Act I')
    expect(releaseNameOf('1.0.0')).toBe('Act III')
    expect(releaseNameOf('2.4.0')).toBeNull()
  })
})

describe('stageOf', () => {
  it('says the pre-release in words, and nothing for a final release', () => {
    expect(stageOf('0.1.0-alpha.1')).toBe('alpha 1')
    expect(stageOf('0.1.0-beta.2')).toBe('beta 2')
    expect(stageOf('0.1.0-rc.1')).toBe('release candidate 1')
    expect(stageOf('0.1.0-alpha')).toBe('alpha')
    expect(stageOf('0.1.0')).toBeNull()
  })
})

describe('aboutOf', () => {
  it('links the source, the changelog and the ways to take part', () => {
    const about = aboutOf('0.1.0-alpha.1', '', REPO)
    expect(about).toMatchObject({ version: '0.1.0-alpha.1', release: 'The Surface', stage: 'alpha 1', build: null })
    expect(about.links).toEqual({
      source: REPO,
      changelog: `${REPO}/blob/main/CHANGELOG.md`,
      contributing: `${REPO}/blob/main/CONTRIBUTING.md`,
      roadmap: `${REPO}/blob/main/docs/ROADMAP.md`,
      issues: `${REPO}/issues/new/choose`,
      commit: null,
    })
  })

  it('shows the commit a build was made from, when the build knows it', () => {
    const about = aboutOf('0.1.0', '1f289231c0ffee', REPO)
    expect(about.build).toBe('1f28923')
    expect(about.links.commit).toBe(`${REPO}/commit/1f289231c0ffee`)
  })
})
