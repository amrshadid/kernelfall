import { SectionHead } from '@shared/components/ui'

export interface AboutSectionProps {
  version: string
  /** Where saves go, e.g. "Saved in this browser", or why they don't. */
  storage: string
}

export function AboutSection({ version, storage }: AboutSectionProps) {
  return (
    <section aria-labelledby="settings-about-h" className="settings__section" id="settings-about">
      <SectionHead id="settings-about-h">6 · About</SectionHead>
      <dl className="settings-about">
        <dt>Version</dt>
        <dd>{version}</dd>
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
