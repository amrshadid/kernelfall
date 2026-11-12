import { RELEASE_NAMES } from './release.constants'

export interface AboutLinks {
  readonly source: string
  readonly changelog: string
  readonly contributing: string
  readonly roadmap: string
  readonly issues: string
  /** The commit this build was made from; null for a build that doesn't know it. */
  readonly commit: string | null
}

export interface AboutInfo {
  /** As released: "0.1.0-alpha.1". */
  readonly version: string
  /** The milestone the version belongs to: "The Surface"; null for one the roadmap doesn't name. */
  readonly release: string | null
  /** "alpha 1", "beta 2", "release candidate 1"; null for a final release. */
  readonly stage: string | null
  /** The commit's first seven characters; null when the build doesn't know its commit. */
  readonly build: string | null
  readonly links: AboutLinks
}

const STAGES: Readonly<Record<string, string>> = { alpha: 'alpha', beta: 'beta', rc: 'release candidate' }

/** "0.1.0-alpha.1" belongs to 0.1, The Surface. */
export function releaseNameOf(version: string): string | null {
  const [major, minor] = version.split('.')
  return RELEASE_NAMES[`${major}.${minor}`] ?? null
}

/** The pre-release part in words: "alpha 1" for "0.1.0-alpha.1". */
export function stageOf(version: string): string | null {
  const [, tag, number] = version.match(/-([a-z]+)\.?(\d+)?$/) ?? []
  if (tag === undefined) {
    return null
  }
  return [STAGES[tag] ?? tag, number].filter(Boolean).join(' ')
}

export function aboutOf(version: string, commit: string, repository: string): AboutInfo {
  const build = commit === '' ? null : commit.slice(0, 7)
  return {
    version,
    release: releaseNameOf(version),
    stage: stageOf(version),
    build,
    links: {
      source: repository,
      changelog: `${repository}/blob/main/CHANGELOG.md`,
      contributing: `${repository}/blob/main/CONTRIBUTING.md`,
      roadmap: `${repository}/blob/main/docs/ROADMAP.md`,
      issues: `${repository}/issues/new/choose`,
      commit: commit === '' ? null : `${repository}/commit/${commit}`,
    },
  }
}
