import type { SettingsValues } from '@features/settings/types'
import { SectionHead, Segmented } from '@shared/components/ui'
import { SettingRow } from './SettingRow'

export interface PrivacySectionProps {
  /** False in a build without a Clarity id: nothing is recorded, so there is nothing to turn off. */
  clarityConfigured: boolean
  shareRecordings: boolean
  onChange: (patch: Partial<SettingsValues>) => void
}

export function PrivacySection({ clarityConfigured, shareRecordings, onChange }: PrivacySectionProps) {
  return (
    <section aria-labelledby="settings-privacy-h" className="settings__section" id="settings-privacy">
      <SectionHead id="settings-privacy-h">5 · Privacy</SectionHead>
      {clarityConfigured ? (
        <>
          <SettingRow
            label="Share usage recordings"
            description="Recordings show what is hard to find or understand, so it can be made easier. Turning this off takes effect the next time the game loads."
          >
            <Segmented
              legend="Share usage recordings"
              value={shareRecordings ? 'on' : 'off'}
              onChange={(share) => onChange({ shareRecordings: share === 'on' })}
              options={[
                { value: 'on', label: 'Share' },
                { value: 'off', label: "Don't share" },
              ]}
            />
          </SettingRow>
          <dl className="settings-about">
            <dt>What is recorded</dt>
            <dd>
              Microsoft Clarity records how the game is played: clicks, scrolling, the screens you open, and what you
              type in the terminal and the editor. It runs without cookies. Microsoft handles that data under its{' '}
              <a href="https://privacy.microsoft.com/privacystatement" target="_blank" rel="noreferrer">
                privacy statement
              </a>
              .
            </dd>
            <dt>Keep it out</dt>
            <dd>Don't type anything private in the terminal or the editor.</dd>
            <dt>Stays in your browser</dt>
            <dd>Your saves and progress, your code files, and the Machine: its disk, its files and what it runs.</dd>
            <dt>Turning it off</dt>
            <dd>Choose "Don't share" above. From the next time the game loads, Clarity isn't loaded at all.</dd>
          </dl>
        </>
      ) : (
        <dl className="settings-about">
          <dt>What is recorded</dt>
          <dd>Nothing: this copy of the game has no recording service.</dd>
          <dt>Stays in your browser</dt>
          <dd>Your saves and progress, your code files, and the Machine: its disk, its files and what it runs.</dd>
        </dl>
      )}
    </section>
  )
}
