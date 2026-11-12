import { Icon, SectionHead } from '@shared/components/ui'
import type { AboutInfo } from '@shared/utils/app'

export interface AboutSectionProps {
  about: AboutInfo
  /** Where saves go, e.g. "Saved in this browser", or why they don't. */
  storage: string
}

const outside = { target: '_blank', rel: 'noreferrer' } as const

export function AboutSection({ about, storage }: AboutSectionProps) {
  const { links } = about
  return (
    <section aria-labelledby="settings-about-h" className="settings__section" id="settings-about">
      <SectionHead id="settings-about-h">6 · About</SectionHead>
      <dl className="settings-about">
        <dt>Version</dt>
        <dd>
          <b className="settings-about__version">{about.version}</b>
          {about.release && (
            <>
              {' '}
              · {about.stage ? `${about.stage} of ` : ''}
              {about.release}
            </>
          )}
          {about.build && links.commit && (
            <>
              {' '}
              · build{' '}
              <a href={links.commit} {...outside}>
                {about.build}
              </a>
            </>
          )}
          <br />
          <a href={links.changelog} {...outside}>
            What changed in each version
          </a>
        </dd>
        <dt>Source</dt>
        <dd>
          Kernelfall is free and open source: every level, checker and line of the game is public.
          <br />
          <a className="settings-about__source" href={links.source} {...outside}>
            <Icon name="source" size={16} />
            Source on GitHub
          </a>
        </dd>
        <dt>Join us</dt>
        <dd>
          The game is built in the open, and it needs people who know Linux as much as people who are learning it. Check
          a level against a real kernel, improve a Codex card, or build a level of your own.
          <br />
          <a href={links.contributing} {...outside}>
            How to contribute
          </a>
          {' · '}
          <a href={links.roadmap} {...outside}>
            What's next
          </a>
          {' · '}
          <a href={links.issues} {...outside}>
            Report something that doesn't match real Linux
          </a>
        </dd>
        <dt>Your data</dt>
        <dd>{storage}. No accounts: your progress and code never leave this browser (see Privacy).</dd>
        <dt>The Machine</dt>
        <dd>Real Linux on an emulated PC (v86), running in this browser. Your C is built by gcc inside it.</dd>
        <dt>Licence</dt>
        <dd>The game is MIT. Kernel C in the levels is GPL-2.0, like the kernel itself.</dd>
      </dl>
    </section>
  )
}
